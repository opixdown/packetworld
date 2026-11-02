import { formatMs, type JourneyBuilder } from '../builder'
import type { Field, Layer, WorldPatch } from '../types'
import { segment } from './segment'
import { ENCRYPTED_OBSERVER, RECORD_OVERHEAD, dataRto, type TlsResult } from './tls'

// Stage 4: HTTP/1.1 request and response. Over HTTPS each message travels
// inside a TLS record, so on the wire it is RECORD_OVERHEAD bytes bigger and
// unreadable to anyone but the two endpoints.

const CRLF = '\r\n'

export function requestText(host: string, path: string, accept: string): string {
  return [
    `GET ${path} HTTP/1.1`,
    `Host: ${host}`,
    'User-Agent: Mozilla/5.0 (PacketWorld simulated browser)',
    `Accept: ${accept}`,
    'Accept-Encoding: gzip, br',
    'Connection: keep-alive',
    '',
    '',
  ].join(CRLF)
}

export function pageHtml(host: string): string {
  const example = /^(www\.)?example\.(com|org|net)$/.test(host)
  const title = example ? 'Example Domain' : `Welcome to ${host}`
  const text = example
    ? 'This domain is for use in documentation examples without needing permission.'
    : 'This page was produced by the PacketWorld simulator. No real request was made.'
  return `<!doctype html>\n<html>\n<head>\n  <title>${title}</title>\n  <link rel="stylesheet" href="/style.css">\n</head>\n<body>\n  <h1>${title}</h1>\n  <p>${text}</p>\n</body>\n</html>\n`
}

export const STYLE_CSS = 'body{font-family:system-ui;max-width:36rem;margin:3rem auto;color:#1f2937}h1{color:#0f766e}\n'

export const NOT_FOUND_HTML = '<!doctype html>\n<html><body><h1>404 Not Found</h1><p>The requested page does not exist.</p></body></html>\n'

export function responseText(status: string, contentType: string, body: string, cache: string): string {
  return [`HTTP/1.1 ${status}`, `Content-Type: ${contentType}`, `Content-Length: ${utf8Length(body)}`, `Cache-Control: ${cache}`, '', body].join(CRLF)
}

export function utf8Length(s: string): number {
  return new TextEncoder().encode(s).length
}

function httpLayer(text: string, encrypted: boolean, fields: Field[]): Layer {
  return {
    name: 'HTTP/1.1',
    protocol: 'http',
    encrypted,
    fields: [...fields, { name: 'Raw message', value: text.replace(/\r\n/g, '\n') }],
  }
}

function tlsRecord(length: number): Layer {
  return {
    name: 'TLS record',
    protocol: 'tls',
    fields: [
      { name: 'Content type', value: 'Application data (23)' },
      { name: 'Length', value: `${length - 5} bytes`, note: 'HTTP message + 1-byte inner type + 16-byte AES-GCM authentication tag.' },
      { name: 'Cipher', value: 'AES-128-GCM with the client→server or server→client application key' },
    ],
  }
}

export function buildHttp(b: JourneyBuilder, tls: TlsResult): boolean {
  const { target, config } = b
  const secure = target.scheme === 'https'
  const host = target.host
  const rto = dataRto(b)
  const timerText = (t: number) => ({
    beginner: `The data didn’t get through, so after ${formatMs(t)} it is sent again. TCP makes sure nothing is missing.`,
    technical: `RTO ${formatMs(t)} fired; segment retransmitted. (With several segments in flight, SACK and fast retransmit would usually recover sooner.)`,
  })
  let c = tls.clientSeq
  let s = tls.serverSeq
  const notFound = config.scenario === 'http-404'
  const observer = secure
    ? ENCRYPTED_OBSERVER(host, target.port)
    : ['Everything: the URL, every header, cookies and the full page content. Anyone on the path could also modify it.']

  const send = (o: {
    dir: 'up' | 'down'
    label: string
    text: string
    fields: Field[]
    beginner: { what: string; why: string; analogy?: string }
    technical: { what: string; why: string }
    at?: number
    onStart?: WorldPatch
    onEnd?: WorldPatch
    tone?: 'success' | 'error'
  }) => {
    const plain = utf8Length(o.text)
    const wire = secure ? plain + RECORD_OVERHEAD : plain
    const seq = o.dir === 'up' ? c : s
    const ack = o.dir === 'up' ? s : c
    b.reliable(
      'http',
      () => {
        const spec = segment(target, {
          dir: o.dir,
          label: o.label,
          seq,
          ack,
          flags: ['PSH', 'ACK'],
          payload: wire,
          encrypted: secure,
          app: secure ? undefined : httpLayer(o.text, false, o.fields),
          beginner: o.beginner,
          technical: o.technical,
          observerSees: observer,
        })
        // Over HTTPS the HTTP message rides inside an encrypted TLS record.
        if (secure) {
          spec.layers.push(tlsRecord(wire), httpLayer(o.text, true, o.fields))
          spec.protocol = 'http'
        }
        return spec
      },
      { rto, timerText, at: o.at, onStart: o.onStart, onEnd: o.onEnd, tone: o.tone },
    )
    if (o.dir === 'up') c += wire
    else s += wire
  }

  // Request
  const path = target.path || '/'
  const req = requestText(host, path, 'text/html')
  send({
    dir: 'up',
    label: `GET ${path.length > 14 ? path.slice(0, 13) + '…' : path}`,
    text: req,
    at: tls.sendAt,
    fields: [
      { name: 'Method', value: 'GET', note: 'GET asks for a resource without changing anything on the server.' },
      { name: 'Path', value: path },
      { name: 'Version', value: 'HTTP/1.1' },
      { name: 'Host', value: host, note: 'Required in HTTP/1.1: one IP address can host many websites.' },
    ],
    beginner: {
      what: `Your browser finally asks for the page: “Please GET me ${path} from ${host}.”`,
      why: secure
        ? 'This is the moment everything before was preparing for. The request is encrypted, so only the server can read it.'
        : 'This is the moment everything before was preparing for. Without HTTPS anyone on the path can read this request.',
      analogy: 'Like handing a librarian a slip with the book you want written on it.',
    },
    technical: {
      what: `HTTP/1.1 GET ${path}, ${utf8Length(req)} bytes${secure ? ` (${utf8Length(req) + RECORD_OVERHEAD} on the wire inside a TLS record)` : ''}, sent at seq ${c}.`,
      why: secure
        ? 'Sent immediately behind the client Finished: TLS 1.3 needs no extra round trip before application data.'
        : `Plaintext HTTP on port ${target.port}.`,
    },
    onStart: { browser: 'waiting' },
    onEnd: tls.serverAwaitingAck ? { tcpServer: 'ESTABLISHED' } : undefined,
  })

  b.local(
    'http',
    'server',
    `Server builds the response (${formatMs(config.serverTimeMs)})`,
    {
      beginner: `The server looks up ${path}${notFound ? ' and finds nothing there' : ', and prepares the page'}. Slow servers make you wait here.`,
      technical: `Application processing time: ${formatMs(config.serverTimeMs)}. Together with one RTT, this makes up the time to first byte (TTFB).`,
      why: 'Some pages are stored ready-made; others are built fresh, for example by reading a database.',
      analogy: 'The waiter has taken your order; now the kitchen cooks it.',
    },
    { duration: config.serverTimeMs },
  )

  if (notFound) {
    const res = responseText('404 Not Found', 'text/html; charset=UTF-8', NOT_FOUND_HTML, 'no-store')
    send({
      dir: 'down',
      label: '404 Not Found',
      text: res,
      tone: 'error',
      fields: [
        { name: 'Status', value: '404 Not Found', note: '4xx codes mean the request itself has a problem; here, the page does not exist.' },
        { name: 'Content-Type', value: 'text/html; charset=UTF-8' },
        { name: 'Content-Length', value: `${utf8Length(NOT_FOUND_HTML)} bytes` },
      ],
      beginner: {
        what: 'The server answers: “Sorry, there’s no page at that address (404).” It still sends a small page explaining that.',
        why: 'The network worked perfectly. DNS, TCP and TLS all succeeded. The problem is the address of the page, not the connection.',
      },
      technical: {
        what: `HTTP/1.1 404 Not Found with a ${utf8Length(NOT_FOUND_HTML)}-byte HTML body.`,
        why: '404 is an application-level result. The TCP connection stays open (keep-alive) for further requests.',
      },
      onEnd: { httpStatus: 404, browser: 'rendered', resources: ['html'] },
    })
    return false
  }

  const html = pageHtml(host)
  const res = responseText('200 OK', 'text/html; charset=UTF-8', html, 'max-age=3600')
  send({
    dir: 'down',
    label: '200 OK',
    text: res,
    tone: 'success',
    fields: [
      { name: 'Status', value: '200 OK', note: '2xx means success.' },
      { name: 'Content-Type', value: 'text/html; charset=UTF-8', note: 'Tells the browser how to interpret the body.' },
      { name: 'Content-Length', value: `${utf8Length(html)} bytes` },
      { name: 'Cache-Control', value: 'max-age=3600', note: 'The browser may reuse this response for an hour.' },
    ],
    beginner: {
      what: 'The server sends the page back: a status saying “OK”, some labels describing it, and the HTML itself.',
      why: 'HTML is the page’s structure: headings, text and links to other files the page needs.',
    },
    technical: {
      what: `HTTP/1.1 200 OK, ${utf8Length(res)} bytes${secure ? ` (+${RECORD_OVERHEAD} TLS overhead)` : ''} at seq ${s}.`,
      why: 'The server chose not to compress this small page. Larger responses are usually gzip or Brotli encoded.',
    },
    onEnd: { httpStatus: 200, browser: 'html', resources: ['html'] },
  })

  b.local(
    'http',
    'client',
    'Browser reads the HTML and finds more to fetch',
    {
      beginner:
        'The browser starts reading the HTML and spots a link to a stylesheet (style.css). Real pages also pull in JavaScript, images and fonts, often dozens of files.',
      technical:
        'The HTML parser’s preload scanner discovers <link rel="stylesheet" href="/style.css">. CSS is render-blocking, so it is fetched before first paint. HTTP/1.1 reuses this keep-alive connection; HTTP/2 or HTTP/3 would multiplex many requests at once.',
      why: 'A web page is many files. The HTML is the list of ingredients; the browser fetches each one.',
    },
    { duration: 1 },
  )

  const cssReq = requestText(host, '/style.css', 'text/css')
  send({
    dir: 'up',
    label: 'GET /style.css',
    text: cssReq,
    fields: [
      { name: 'Method', value: 'GET' },
      { name: 'Path', value: '/style.css' },
      { name: 'Host', value: host },
    ],
    beginner: {
      what: 'Your browser asks for the stylesheet: the file that says what the page should look like.',
      why: 'It uses the same connection, so there is no new handshake. Reusing connections saves a lot of time.',
    },
    technical: { what: `GET /style.css on the same TCP+TLS connection, seq ${c}.`, why: 'Connection reuse avoids another 2 RTTs of TCP and TLS setup.' },
  })

  b.local(
    'http',
    'server',
    'Server reads style.css (2 ms)',
    { beginner: 'A plain file: quick to send.', technical: 'Static file served from memory.' },
    { duration: 2 },
  )

  const cssRes = responseText('200 OK', 'text/css', STYLE_CSS, 'max-age=86400')
  send({
    dir: 'down',
    label: '200 OK (CSS)',
    text: cssRes,
    tone: 'success',
    fields: [
      { name: 'Status', value: '200 OK' },
      { name: 'Content-Type', value: 'text/css' },
      { name: 'Content-Length', value: `${utf8Length(STYLE_CSS)} bytes` },
    ],
    beginner: { what: 'The stylesheet arrives.', why: 'Now the browser knows the fonts, colours and layout.' },
    technical: { what: `200 OK text/css, ${utf8Length(STYLE_CSS)}-byte body.`, why: 'With HTML and CSS the browser can build the render tree and paint.' },
    onEnd: { resources: ['html', 'css'] },
  })

  b.local(
    'http',
    'client',
    'Page rendered',
    {
      beginner: `Done! The browser draws the page on your screen. Everything you just watched usually takes a fraction of a second.`,
      technical: `Parse → style → layout → paint. First paint at ${formatMs(b.now)} simulated. The connection stays open (keep-alive) for later requests.`,
      why: 'You just watched DNS, TCP, TLS and HTTP work together. In real life all of this takes well under a second.',
    },
    { duration: 4, tone: 'success', onEnd: { browser: 'rendered' } },
  )
  return true
}
