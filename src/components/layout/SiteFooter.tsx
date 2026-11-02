import { Link } from 'react-router-dom'
import { REPO_URL } from '../../lib/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-rule/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-fg-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>PacketWorld is open source (MIT). Every packet on the map is simulated. The only real request is the “Look it up for real” button, and only when you press it.</p>
        <div className="flex gap-4">
          <Link to="/learn" className="hover:text-fg">
            Lessons
          </Link>
          <a href={`${REPO_URL}/blob/main/docs/ACCURACY.md`} className="hover:text-fg">
            Accuracy notes
          </a>
          <a href={REPO_URL} className="hover:text-fg">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
