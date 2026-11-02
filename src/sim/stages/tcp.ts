import { formatMs, type JourneyBuilder } from '../builder'
import { CLIENT_ISN, SERVER_ISN, segment } from './segment'

// Stage 2: the TCP three-way handshake.
//
// Sequence numbers use small, readable values (client 1000, server 5000).
// Real stacks pick random 32-bit initial sequence numbers (RFC 6528).
// See docs/decisions/0010-readable-sequence-numbers.md.

export interface TcpResult {
  ok: boolean
  /** Next sequence number each side will send. */
  clientSeq: number
  serverSeq: number
  /** True when the final ACK was lost, so the server is still SYN-RECEIVED. */
  serverAwaitingAck: boolean
}

const SYN_RTO = 1000

export function buildTcp(b: JourneyBuilder): TcpResult {
  const { target, config } = b
  const scenario = config.scenario
  const fail: TcpResult = { ok: false, clientSeq: CLIENT_ISN + 1, serverSeq: SERVER_ISN + 1, serverAwaitingAck: false }

  b.local(
    'tcp',
    'client',
    `Open a connection to ${target.serverIp}:${target.port}`,
    {
      beginner: `Now the browser knows where the server is. Before sending the real request, it sets up a reliable connection with a three-step greeting called the TCP handshake.`,
      technical: `connect() to ${target.serverIp}:${target.port}. The kernel picks ephemeral source port 52144 and initial sequence number ${CLIENT_ISN}. TCP and TLS are separate handshakes: TCP first, then TLS on top.`,
      why: 'The internet can lose or shuffle packets. TCP numbers everything so the two sides can notice and fix that, but first they must agree to talk.',
      analogy: 'Like checking “hello, can you hear me?” at the start of a phone call.',
    },
    { duration: 0.1 },
  )

  const syn = (retry: boolean) =>
    segment(target, {
      dir: 'up',
      label: 'SYN',
      seq: CLIENT_ISN,
      flags: ['SYN'],
      beginner: {
        what: retry
          ? 'Your browser asks again: “Can we talk?” Same message, same starting number, because the first one got no reply.'
          : 'Your browser asks the server: “Can we talk?” It also picks a starting number (1000) for counting the bytes it will send.',
        why: 'Before any data flows, both sides need to know the other is there and agree on starting numbers, so lost or out-of-order data can be detected later.',
        analogy: 'Like starting a phone call with “Hello, can you hear me?”',
      },
      technical: {
        what: `SYN, seq=${CLIENT_ISN}. Client moves CLOSED → SYN-SENT.${retry ? ' Retransmission uses the same ISN.' : ''}`,
        why: 'The SYN flag consumes one sequence number, so the server will acknowledge 1001. Options negotiate maximum segment size, selective ACKs and window scaling.',
      },
    })

  // Server never answers: SYNs go out, nothing comes back.
  if (scenario === 'server-timeout') {
    const firstSynAt = b.now
    let rto = SYN_RTO
    for (let attempt = 0; attempt < 3; attempt++) {
      b.packet('tcp', syn(attempt > 0), {
        fate: 'ignored',
        retransmission: attempt > 0,
        onStart: { tcpClient: 'SYN-SENT', browser: 'connecting' },
        title: `${attempt > 0 ? 'Retransmitted SYN' : 'SYN'} (no reply)`,
        text: {
          beginner:
            attempt === 0
              ? 'The SYN reaches the server’s address, but nothing answers. Maybe the server is down, overloaded, or a firewall silently drops the packet.'
              : 'Still nothing. Your computer tries again, waiting twice as long each time.',
          technical:
            attempt === 0
              ? 'SYN sent, no SYN-ACK and no RST. A closed port would answer RST immediately; silence usually means a filtering firewall or a dead host.'
              : `Retransmission #${attempt}. Exponential backoff: the RTO doubles after each timeout (RFC 6298).`,
        },
      })
      b.local(
        'tcp',
        'client',
        `Waiting ${formatMs(rto)} for a SYN-ACK`,
        {
          beginner: `Your computer waits ${formatMs(rto)} for an answer that never comes.`,
          technical: `RTO = ${formatMs(rto)}. Initial RTO is 1 s (RFC 6298), doubled on each retry.`,
        },
        { duration: rto, tone: 'warning' },
      )
      rto *= 2
    }
    b.local(
      'tcp',
      'client',
      'Connection timed out',
      {
        beginner:
          'After several more tries (more than two minutes on Linux), your computer gives up. The browser shows a “took too long to respond” error. Browsers may give up sooner.',
        technical:
          'Linux sends 6 SYN retries by default (net.ipv4.tcp_syn_retries), timing out around 127 s after the first SYN. connect() returns ETIMEDOUT; Chrome reports ERR_CONNECTION_TIMED_OUT.',
      },
      {
        duration: firstSynAt + 127000 - b.now,
        skipsTime: true,
        tone: 'error',
        onEnd: {
          tcpClient: 'CLOSED',
          browser: 'error',
          error: {
            title: 'This site can’t be reached',
            code: 'ERR_CONNECTION_TIMED_OUT',
            detail: `${target.host} took too long to respond.`,
          },
        },
      },
    )
    return fail
  }

  let rto = SYN_RTO
  let forcedSynLoss = scenario === 'syn-lost' ? 1 : 0
  let forcedSynAckLoss = scenario === 'synack-lost' ? 1 : 0
  let synAckSent = false
  for (let attempt = 0; ; attempt++) {
    const sentAt = b.now
    const synLost = forcedSynLoss-- > 0 || (attempt < 3 && b.rollLoss())
    b.packet('tcp', syn(attempt > 0), {
      fate: synLost ? 'lost' : 'delivered',
      retransmission: attempt > 0,
      title: `${attempt > 0 ? 'Retransmitted SYN' : 'SYN'}${synLost ? ' (lost)' : ''}`,
      text: synLost
        ? {
            beginner: 'The SYN is lost on the way. The server never knew you wanted to talk, and your computer doesn’t know the packet vanished.',
            technical: 'SYN dropped in transit. The client stays in SYN-SENT with its retransmission timer running.',
          }
        : undefined,
      onStart: { tcpClient: 'SYN-SENT', browser: 'connecting' },
      onEnd: { tcpServer: 'SYN-RECEIVED' },
    })
    if (synLost) {
      timeout(b, rto, sentAt, 'SYN-ACK')
      rto *= 2
      continue
    }

    const synAckLost = forcedSynAckLoss-- > 0 || (attempt < 3 && b.rollLoss())
    b.packet(
      'tcp',
      segment(target, {
        dir: 'down',
        label: 'SYN-ACK',
        seq: SERVER_ISN,
        ack: CLIENT_ISN + 1,
        flags: ['SYN', 'ACK'],
        beginner: {
          what: 'The server replies: “Yes, I hear you (ACK). Can you hear me? My starting number is 5000 (SYN).”',
          why: 'One packet does two jobs: it confirms the client’s message and starts the server’s own direction of the conversation.',
          analogy: '“Yes, I can hear you. Can you hear me?”',
        },
        technical: {
          what: `SYN+ACK: seq=${SERVER_ISN}, ack=${CLIENT_ISN + 1}. Server is in SYN-RECEIVED (a half-open connection).`,
          why: `ack=${CLIENT_ISN + 1} means “I received everything up to byte ${CLIENT_ISN}; send ${CLIENT_ISN + 1} next”. The server picks its own ISN independently.`,
        },
      }),
      {
        fate: synAckLost ? 'lost' : 'delivered',
        retransmission: synAckSent,
        title: `${synAckSent ? 'Retransmitted ' : ''}SYN-ACK${synAckLost ? ' (lost)' : ''}`,
        text: synAckLost
          ? {
              beginner:
                'The server’s reply is lost. The server thinks it answered; your computer thinks it never heard back. Someone has to try again.',
              technical:
                'SYN-ACK dropped. The client’s SYN timer will fire and it retransmits the SYN; the server would also retransmit its SYN-ACK on its own timer. Whichever happens first recovers the handshake.',
            }
          : undefined,
        onEnd: { tcpClient: 'ESTABLISHED' },
      },
    )
    synAckSent = true
    if (synAckLost) {
      timeout(b, rto, sentAt, 'SYN-ACK')
      rto *= 2
      continue
    }
    break
  }

  const ackLost = scenario === 'ack-lost' || b.rollLoss()
  const ack = b.packet(
    'tcp',
    segment(target, {
      dir: 'up',
      label: 'ACK',
      seq: CLIENT_ISN + 1,
      ack: SERVER_ISN + 1,
      flags: ['ACK'],
      beginner: {
        what: 'Your browser answers: “Yes, I hear you too.” Both sides have now confirmed they can send and receive.',
        why: 'Why three messages? Each side must send its own starting number AND hear the other confirm it. The middle packet combines the server’s confirmation and its own start, so three is the minimum.',
        analogy: '“Great, I hear you too. Let’s talk.”',
      },
      technical: {
        what: `ACK: seq=${CLIENT_ISN + 1}, ack=${SERVER_ISN + 1}. The client became ESTABLISHED when the SYN-ACK arrived; the server becomes ESTABLISHED when this ACK arrives.`,
        why: 'The three-way exchange synchronises both initial sequence numbers and protects against old duplicate SYNs creating bogus connections (RFC 9293).',
      },
    }),
    {
      fate: ackLost ? 'lost' : 'delivered',
      title: `ACK${ackLost ? ' (lost)' : ''}`,
      text: ackLost
        ? {
            beginner:
              'The final ACK is lost. Your browser thinks the connection is ready and carries on. The server is still waiting… but the next packet the browser sends will also carry the acknowledgment, so the handshake completes anyway.',
            technical:
              'Final ACK dropped. Client is ESTABLISHED; server remains SYN-RECEIVED. TCP does not retransmit pure ACKs, but every later segment carries ACK=5001, so the first data segment completes the handshake. If no data came, the server would retransmit its SYN-ACK.',
          }
        : undefined,
      tone: ackLost ? 'warning' : 'success',
      onEnd: { tcpServer: 'ESTABLISHED' },
    },
  )
  // The client does not wait for its ACK to arrive: it can send data at once.
  b.now = ack.t

  return { ok: true, clientSeq: CLIENT_ISN + 1, serverSeq: SERVER_ISN + 1, serverAwaitingAck: ackLost }
}

function timeout(b: JourneyBuilder, rto: number, sentAt: number, waitingFor: string) {
  const remaining = Math.max(0, sentAt + rto - b.now)
  b.local(
    'tcp',
    'client',
    `Retransmission timer expires (${formatMs(rto)})`,
    {
      beginner: `No ${waitingFor} arrived within ${formatMs(rto)}, so your computer assumes the SYN was lost and sends it again.`,
      technical: `SYN RTO fired at ${formatMs(rto)} after sending (initial RTO 1 s per RFC 6298, doubling on each retry).`,
      why: 'Nobody tells the sender that a packet was lost. Silence for too long is the only clue.',
      analogy: 'You text a friend; no reply after a while, so you send it again.',
    },
    { duration: remaining, tone: 'warning' },
  )
}
