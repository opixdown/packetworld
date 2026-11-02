import { RotateCw } from 'lucide-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

/** Shown instead of a blank screen when a page throws. */
export function RouteError() {
  const error = useRouteError()
  const detail = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : String(error)
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-mono text-sm text-proto-error">Something broke in the simulation</p>
      <h1 className="mt-3 text-2xl font-semibold">This page hit an unexpected error</h1>
      <p className="mt-2 text-fg-muted">Reloading usually fixes it. If it keeps happening, please open a bug report with the message below.</p>
      <pre className="mx-auto mt-4 max-w-full overflow-x-auto rounded-lg border border-rule bg-card px-3 py-2 text-left font-mono text-xs text-fg-muted">{detail}</pre>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={() => window.location.reload()} className="pw-btn-primary">
          <RotateCw size={15} /> Reload
        </button>
        <Link to="/" reloadDocument className="pw-btn-secondary">
          Back to the start
        </Link>
      </div>
    </div>
  )
}
