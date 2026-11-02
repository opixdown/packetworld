import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-mono text-sm text-proto-error">HTTP/1.1 404 Not Found</p>
      <h1 className="mt-3 text-2xl font-semibold">This page took a wrong turn</h1>
      <p className="mt-2 text-fg-muted">The server answered, but there’s nothing at this path.</p>
      <Link to="/" className="pw-btn-secondary mt-6">
        Back to the start
      </Link>
    </div>
  )
}
