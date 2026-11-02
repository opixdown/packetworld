import { useState } from 'react'
import { cx } from '../../lib/cx'
import { pageHtml, utf8Length } from '../../sim/stages/http'
import { useMode } from '../../state/mode'

// Lesson 7: click any part of a real HTTP request or response to learn what it does.

interface Part {
  text: string
  id?: string
}

const NOTES: Record<string, { beginner: string; technical: string }> = {
  method: {
    beginner: 'The verb: what you want to do. GET means “give me this”. POST sends data, like a form.',
    technical: 'Request method (RFC 9110 §9). GET is safe and idempotent; POST, PUT, PATCH and DELETE change server state.',
  },
  path: {
    beginner: 'Which page on the site you want. “/” is the home page.',
    technical: 'The request target: path plus optional query string. The scheme and host are not repeated here in origin-form.',
  },
  version: {
    beginner: 'Which version of HTTP the browser is speaking.',
    technical: 'HTTP/1.1 is text based. HTTP/2 and HTTP/3 carry the same semantics in binary frames.',
  },
  host: {
    beginner: 'Which website you mean. One server (one IP address) can host thousands of sites, so it needs to be told.',
    technical: 'Mandatory in HTTP/1.1. Virtual hosting picks the site by this header (and by SNI during TLS).',
  },
  headers: {
    beginner: 'Extra details about the request, like which browser you use and what formats you accept.',
    technical: 'Header fields: name: value pairs ending in CRLF. An empty line ends the header section.',
  },
  status: {
    beginner: 'The server’s short answer. 200 means OK. 404 means not found. 500 means the server broke.',
    technical: '1xx informational, 2xx success, 3xx redirection, 4xx client error, 5xx server error (RFC 9110 §15).',
  },
  ctype: {
    beginner: 'What kind of content follows, so the browser knows to show it as a web page.',
    technical: 'Media type plus charset. Browsers rely on it (and X-Content-Type-Options: nosniff can forbid guessing).',
  },
  length: {
    beginner: 'How big the content is, so the browser knows when it has received all of it.',
    technical: 'Body length in bytes. Alternatively Transfer-Encoding: chunked when the size is not known up front.',
  },
  cache: {
    beginner: 'How long the browser may keep and reuse this response without asking again.',
    technical: 'max-age=3600 lets caches reuse the response for an hour without revalidation.',
  },
  body: {
    beginner: 'The actual page: HTML that the browser turns into what you see.',
    technical: 'The representation data, after an empty CRLF line. Here, text/html.',
  },
}

const REQUEST: Part[][] = [
  [{ text: 'GET', id: 'method' }, { text: ' ' }, { text: '/', id: 'path' }, { text: ' ' }, { text: 'HTTP/1.1', id: 'version' }],
  [{ text: 'Host: example.com', id: 'host' }],
  [{ text: 'User-Agent: Mozilla/5.0 …', id: 'headers' }],
  [{ text: 'Accept: text/html', id: 'headers' }],
  [{ text: '' }],
]

const RESPONSE: Part[][] = [
  [{ text: 'HTTP/1.1', id: 'version' }, { text: ' ' }, { text: '200 OK', id: 'status' }],
  [{ text: 'Content-Type: text/html; charset=UTF-8', id: 'ctype' }],
  [{ text: `Content-Length: ${utf8Length(pageHtml('example.com'))}`, id: 'length' }],
  [{ text: 'Cache-Control: max-age=3600', id: 'cache' }],
  [{ text: '' }],
  [{ text: '<!doctype html>', id: 'body' }],
  [{ text: '<html> … </html>', id: 'body' }],
]

export function HttpAnatomy() {
  const [active, setActive] = useState('method')
  const { mode } = useMode()
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <Message title="Request" lines={REQUEST} active={active} onPick={setActive} color="text-proto-http" />
        <Message title="Response" lines={RESPONSE} active={active} onPick={setActive} color="text-proto-http" />
      </div>
      <div className="rounded-md border-[1.5px] border-edge bg-card p-4" aria-live="polite">
        <div className="text-xs font-bold text-fg-muted">Selected part</div>
        <p className="mt-2 text-sm leading-relaxed text-fg">{NOTES[active][mode]}</p>
        <p className="mt-4 text-xs text-fg-faint">Click any highlighted part of the request or response.</p>
      </div>
    </div>
  )
}

function Message({ title, lines, active, onPick, color }: { title: string; lines: Part[][]; active: string; onPick: (id: string) => void; color: string }) {
  return (
    <div className="rounded-md border-[1.5px] border-edge bg-card">
      <div className="border-b border-rule px-3 py-1.5 text-xs font-bold text-fg-muted">{title}</div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-6">
        {lines.map((line, i) => (
          <div key={i}>
            {line.map((p, j) =>
              p.id ? (
                <button
                  key={j}
                  onClick={() => onPick(p.id!)}
                  className={cx('rounded px-0.5 transition-colors', active === p.id ? `bg-proto-http/20 ${color}` : 'text-fg hover:bg-rule')}
                >
                  {p.text}
                </button>
              ) : (
                <span key={j}>{p.text || ' '}</span>
              ),
            )}
          </div>
        ))}
      </pre>
    </div>
  )
}
