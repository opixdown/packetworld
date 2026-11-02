import { formatMs, type JourneyBuilder } from '../builder'
import { hash, hexFrom } from '../random'
import { segment } from './segment'
import type { TcpResult } from './tcp'

// Stage 3: the TLS 1.3 handshake (RFC 8446). One round trip: the client sends
// its key share in the ClientHello, so after the server's single flight both
// sides can derive keys and the client can send encrypted data immediately.
//
// Simplifications (docs/ACCURACY.md):
// - The client sends an empty legacy_session_id, so no middlebox-compatibility
//   ChangeCipherSpec records appear.
// - The server's NewSessionTicket messages are not shown.

export const CLIENT_HELLO_BYTES = 517
export const SERVER_HELLO_BYTES = 95
export const SERVER_CERT_BYTES = 2412
export const SERVER_FINISH_BYTES = 162
export const CLIENT_FINISHED_BYTES = 58
/** TLS 1.3 per-record overhead: 5-byte header + 1 inner content type + 16-byte AEAD tag. */
export const RECORD_OVERHEAD = 22

export interface TlsResult {
  ok: boolean
  clientSeq: number
  serverSeq: number
  /** When the client may send its first encrypted request (together with its Finished). */
  sendAt: number
  /** Set when the first client data segment must still complete the TCP handshake. */
  serverAwaitingAck: boolean
}

export function dataRto(b: JourneyBuilder): number {
  // RFC 6298 after one RTT sample: SRTT + 4·RTTVAR = 3·RTT. Linux floors it at 200 ms.
  return Math.max(200, 3 * b.rtt)
}

export const ENCRYPTED_OBSERVER = (host: string, port: number) => [
  'Both IP addresses and ports (who is talking to whom).',
  'The size and timing of every packet.',
  `The hostname ${host} in the ClientHello’s SNI, unless Encrypted Client Hello (ECH) is used.`,
  `That this is TLS on port ${port}.`,
  'Not visible: URLs, headers, cookies, page content.',
]

export function buildTls(b: JourneyBuilder, tcp: TcpResult): TlsResult {
  const { target, config } = b
  const host = target.host
  let c = tcp.clientSeq
  let s = tcp.serverSeq

  if (target.scheme === 'http') {
    b.local(
      'tls',
      'client',
      'No TLS: this is plain http://',
      {
        beginner:
          'The address starts with http://, not https://, so there is no encryption step. Everything that follows travels as readable text that anyone on the path could see or change.',
        technical: `Plain HTTP on port ${target.port}. No TLS handshake, no server authentication, no confidentiality or integrity. Browsers mark the page “Not secure”.`,
      },
      { tone: 'warning', onEnd: { tls: 'not-used' } },
    )
    return { ok: true, clientSeq: c, serverSeq: s, sendAt: b.now, serverAwaitingAck: tcp.serverAwaitingAck }
  }

  const seed = hash(host)
  const rto = dataRto(b)
  const timerText = (t: number) => ({
    beginner: `No acknowledgment came back within ${formatMs(t)}, so the data is sent again.`,
    technical: `Retransmission timeout ${formatMs(t)} (RTO ≈ 3·RTT after the handshake’s RTT sample, minimum 200 ms on Linux).`,
  })

  // ClientHello
  b.reliable(
    'tls',
    () =>
      segment(target, {
        dir: 'up',
        label: 'Client Hello',
        seq: c,
        ack: s,
        flags: ['PSH', 'ACK'],
        payload: CLIENT_HELLO_BYTES,
        app: {
          name: 'TLS 1.3 · ClientHello',
          protocol: 'tls',
          fields: [
            { name: 'Record', value: `Handshake (22), ${CLIENT_HELLO_BYTES - 5} bytes`, note: 'Record legacy version 0x0301 on the first message, for old middleboxes.' },
            { name: 'legacy_version', value: '0x0303 (TLS 1.2)', note: 'TLS 1.3 is offered in supported_versions instead.' },
            { name: 'random', value: `${hexFrom(seed, 8)}… (32 bytes)` },
            { name: 'cipher_suites', value: 'TLS_AES_128_GCM_SHA256\nTLS_AES_256_GCM_SHA384\nTLS_CHACHA20_POLY1305_SHA256' },
            { name: 'server_name (SNI)', value: host, note: 'Sent in the clear so the server knows which certificate to use.' },
            { name: 'supported_versions', value: 'TLS 1.3, TLS 1.2' },
            { name: 'supported_groups', value: 'x25519, secp256r1' },
            { name: 'key_share', value: `x25519: ${hexFrom(seed + 1, 6)}… (32 bytes)`, note: 'The client’s half of the Diffie–Hellman exchange, sent up front. This is what makes TLS 1.3 one round trip.' },
            { name: 'signature_algorithms', value: 'ecdsa_secp256r1_sha256, rsa_pss_rsae_sha256, …' },
            { name: 'ALPN', value: 'h2, http/1.1', note: 'Which HTTP versions the browser can speak.' },
          ],
        },
        beginner: {
          what: 'Your browser says hello to the server and lists the kinds of encryption it supports. It also sends one half of a secret-making recipe.',
          why: 'The two sides need to agree on how to encrypt and create a shared secret key that nobody listening can work out.',
          analogy: 'Like two people agreeing on a language and a secret code before passing private notes.',
        },
        technical: {
          what: `ClientHello (${CLIENT_HELLO_BYTES} bytes incl. record header) at seq ${c}. Offers TLS 1.3 with an x25519 key share, SNI=${host}, ALPN h2/http/1.1.`,
          why: 'Sending the key share speculatively lets the server derive handshake keys immediately, so the whole handshake takes one round trip (vs two in TLS 1.2).',
        },
        observerSees: ENCRYPTED_OBSERVER(host, target.port).slice(0, 4),
      }),
    {
      rto,
      timerText,
      onStart: { tls: 'negotiating', browser: 'securing' },
      onEnd: tcp.serverAwaitingAck ? { tcpServer: 'ESTABLISHED' } : undefined,
      text: tcp.serverAwaitingAck
        ? {
            beginner:
              'Your browser says hello to the TLS layer. Bonus: this packet also carries the acknowledgment the server never got, so the server’s side of the TCP connection becomes ready too.',
            technical: `ClientHello at seq ${c} with ACK=${s}. Its ACK field completes the server’s handshake (SYN-RECEIVED → ESTABLISHED) despite the lost pure ACK.`,
          }
        : undefined,
    },
  )
  c += CLIENT_HELLO_BYTES

  b.local(
    'tls',
    'server',
    'Server chooses settings and computes the shared secret',
    {
      beginner:
        'The server picks the encryption method, makes its own half of the secret recipe and combines it with the browser’s half. Now it has a secret key that was never sent over the network.',
      technical:
        'Server selects TLS 1.3 + TLS_AES_128_GCM_SHA256, generates an ephemeral x25519 key pair and computes the ECDHE shared secret, then derives handshake traffic keys with HKDF.',
      why: 'The secret key is never sent over the network, so nobody listening can steal it.',
      analogy: 'Two people mix their own secret paint colour into a shared colour. Watchers see the mixes, but can’t un-mix them.',
    },
    { duration: 1 },
  )

  // Server flight: ServerHello, then encrypted EncryptedExtensions, Certificate, CertificateVerify, Finished
  const flightStart = b.now
  const flightArrival = flightStart + b.latency('server', 'client')
  const inFlight = () => (b.now <= flightArrival ? flightStart : undefined)
  const sAck = c

  b.reliable(
    'tls',
    () =>
      segment(target, {
        dir: 'down',
        label: 'Server Hello',
        seq: s,
        ack: sAck,
        flags: ['PSH', 'ACK'],
        payload: SERVER_HELLO_BYTES,
        app: {
          name: 'TLS 1.3 · ServerHello',
          protocol: 'tls',
          fields: [
            { name: 'Record', value: `Handshake (22), ${SERVER_HELLO_BYTES - 5} bytes` },
            { name: 'random', value: `${hexFrom(seed + 2, 8)}… (32 bytes)` },
            { name: 'cipher_suite', value: 'TLS_AES_128_GCM_SHA256 (0x1301)' },
            { name: 'supported_versions', value: 'TLS 1.3 (0x0304)' },
            { name: 'key_share', value: `x25519: ${hexFrom(seed + 3, 6)}… (32 bytes)`, note: 'The server’s half. Both sides can now compute the same shared secret.' },
          ],
        },
        beginner: {
          what: 'The server replies with its choice of encryption and its half of the secret recipe.',
          why: 'With both halves, the browser can compute the same secret key as the server. Someone who saw both halves still can’t.',
        },
        technical: {
          what: `ServerHello at seq ${s}: TLS 1.3, AES-128-GCM, x25519 key share. Last plaintext handshake message.`,
          why: 'Everything after this is encrypted with handshake traffic keys derived from the ECDHE secret.',
        },
      }),
    { rto, timerText, at: flightStart },
  )
  s += SERVER_HELLO_BYTES

  const invalid = config.scenario === 'tls-invalid-cert'
  b.reliable(
    'tls',
    () =>
      segment(target, {
        dir: 'down',
        label: 'Certificate',
        seq: s,
        ack: sAck,
        flags: ['ACK'],
        payload: SERVER_CERT_BYTES,
        encrypted: true,
        app: {
          name: 'TLS 1.3 · EncryptedExtensions + Certificate',
          protocol: 'tls',
          encrypted: true,
          fields: [
            { name: 'Record', value: 'Application data (23) on the wire', note: 'Encrypted with handshake keys; the real type (handshake) is hidden inside.' },
            { name: 'ALPN selected', value: 'http/1.1', note: 'This simulation uses HTTP/1.1 because its text format is easy to read. Many servers would pick h2.' },
            { name: 'Subject', value: `CN=${host}` },
            { name: 'Subject Alt Names', value: `DNS:${host}${host !== target.zone ? `, DNS:${target.zone}` : ''}` },
            { name: 'Issuer', value: 'Example Issuing CA R1 → Example Root CA (illustrative)' },
            {
              name: 'Validity',
              value: invalid ? 'Expired 12 days ago (simulated)' : 'Valid for another 61 days (simulated)',
              note: invalid ? 'An expired certificate can no longer be trusted, even if everything else is fine.' : undefined,
            },
            { name: 'Public key', value: 'ECDSA P-256' },
          ],
        },
        beginner: {
          what: `The server shows its ID card: a certificate saying “I am ${host}”, signed by a Certificate Authority your browser trusts.`,
          why: 'Encryption alone is not enough: you also need to know you are talking to the real site and not an impostor in the middle.',
          analogy: 'Like a passport: issued by an authority you trust, with a name and an expiry date you can check.',
        },
        technical: {
          what: `EncryptedExtensions (ALPN=http/1.1) + Certificate chain (leaf + intermediate), ${SERVER_CERT_BYTES} bytes at seq ${s}.`,
          why: 'In TLS 1.3 the certificate is encrypted, unlike TLS 1.2, so observers cannot see which certificate the server presented.',
        },
        observerSees: ENCRYPTED_OBSERVER(host, target.port),
      }),
    { rto, timerText, at: inFlight() },
  )
  s += SERVER_CERT_BYTES

  b.reliable(
    'tls',
    () =>
      segment(target, {
        dir: 'down',
        label: 'Verify + Finished',
        seq: s,
        ack: sAck,
        flags: ['PSH', 'ACK'],
        payload: SERVER_FINISH_BYTES,
        encrypted: true,
        app: {
          name: 'TLS 1.3 · CertificateVerify + Finished',
          protocol: 'tls',
          encrypted: true,
          fields: [
            { name: 'Record', value: 'Application data (23) on the wire', note: 'Two encrypted records.' },
            { name: 'CertificateVerify', value: 'ecdsa_secp256r1_sha256 signature over the handshake transcript', note: 'Proves the server holds the private key for the certificate.' },
            { name: 'Finished', value: 'HMAC over the whole handshake (32 bytes)', note: 'Proves nobody tampered with any earlier handshake message.' },
          ],
        },
        beginner: {
          what: 'The server proves the ID card is really its own by signing with a private key only it has, then says “I’m done”.',
          why: 'Anyone can copy a certificate (it’s public). Only the real owner has the matching private key to produce this signature.',
        },
        technical: {
          what: `CertificateVerify + server Finished, ${SERVER_FINISH_BYTES} bytes at seq ${s}. Server can now derive application traffic keys.`,
          why: 'Signing the transcript binds the ephemeral key exchange to the certificate’s key, preventing a man-in-the-middle.',
        },
        observerSees: ENCRYPTED_OBSERVER(host, target.port),
      }),
    { rto, timerText, at: inFlight() },
  )
  s += SERVER_FINISH_BYTES

  if (invalid) {
    b.local(
      'tls',
      'client',
      'Certificate check FAILED: expired',
      {
        beginner:
          'Your browser checks the ID card. The name matches and the signature is real, but the certificate expired 12 days ago. The browser refuses to trust it.',
        technical:
          'Path validation fails: notAfter is in the past (RFC 5280 §6.1.3). The browser aborts the handshake rather than risk talking to an impostor.',
      },
      { duration: 2, tone: 'error', onEnd: { tls: 'failed' } },
    )
    b.packet(
      'tls',
      segment(target, {
        dir: 'up',
        label: 'Alert',
        seq: c,
        ack: s,
        flags: ['PSH', 'ACK'],
        payload: 24,
        encrypted: true,
        app: {
          name: 'TLS 1.3 · Alert',
          protocol: 'error',
          encrypted: true,
          fields: [
            { name: 'Level', value: 'fatal' },
            { name: 'Description', value: 'certificate_expired (45)' },
          ],
        },
        beginner: {
          what: 'Your browser tells the server: “Your certificate has expired, I’m hanging up.”',
          why: 'No request is ever sent, so no private data is exposed to a server that might be fake.',
        },
        technical: {
          what: 'Fatal alert certificate_expired(45), encrypted with handshake keys. The connection is then closed (FIN).',
          why: 'TLS alerts tell the peer why the handshake failed.',
        },
      }),
      {
        tone: 'error',
        onEnd: {
          browser: 'error',
          error: {
            title: 'Your connection is not private',
            code: 'NET::ERR_CERT_DATE_INVALID',
            detail: `Attackers might be trying to steal your information from ${host}. The server’s certificate has expired.`,
          },
        },
      },
    )
    return { ok: false, clientSeq: c, serverSeq: s, sendAt: b.now, serverAwaitingAck: false }
  }

  b.local(
    'tls',
    'client',
    'Browser verifies the certificate',
    {
      beginner:
        'Your browser checks the ID card: the name matches, it hasn’t expired, it was signed by a trusted authority, and the server proved it owns it. All good.',
      technical: `Chain validated to a trusted root; ${host} matches a SAN; validity period OK; CertificateVerify signature and server Finished MAC verified. Client derives application traffic keys.`,
      why: 'Encryption is useless if you’re talking to an impostor. This check makes sure the server really is the website you typed.',
      analogy: 'A security guard checking a photo ID: right name, not expired, issued by a real authority.',
    },
    { duration: 2, tone: 'success' },
  )

  const sendAt = b.now
  b.reliable(
    'tls',
    () =>
      segment(target, {
        dir: 'up',
        label: 'Finished',
        seq: c,
        ack: s,
        flags: ['PSH', 'ACK'],
        payload: CLIENT_FINISHED_BYTES,
        encrypted: true,
        app: {
          name: 'TLS 1.3 · Finished',
          protocol: 'tls',
          encrypted: true,
          fields: [
            { name: 'Record', value: 'Application data (23) on the wire' },
            { name: 'Finished', value: 'HMAC over the whole handshake (32 bytes)' },
          ],
        },
        beginner: {
          what: 'Your browser says “I’m done too”. The secure connection is ready.',
          why: 'From now on everything is encrypted with a key only your browser and this server know.',
        },
        technical: {
          what: `Client Finished at seq ${c}, ack ${s}. TLS 1.3 handshake complete after 1 RTT.`,
          why: 'The client does not wait for a reply: it sends the HTTP request right behind its Finished, in the same flight.',
        },
        observerSees: ENCRYPTED_OBSERVER(host, target.port),
      }),
    { rto, timerText, onStart: { tls: 'secure', browser: 'waiting' }, tone: 'success' },
  )
  c += CLIENT_FINISHED_BYTES

  return { ok: true, clientSeq: c, serverSeq: s, sendAt, serverAwaitingAck: false }
}
