import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export const metadata = { title: 'Access Denied | Admissions CRM', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

/**
 * Rendered instead of any restricted page/data when a signed-in staff member
 * (most commonly a Content Manager) reaches a URL they don't have permission
 * for — including by typing it directly rather than clicking a nav link
 * (spec section 7: hiding navigation is not a substitute for backend
 * authorization). lib/auth.ts's guardAdminPage() redirects here before any
 * restricted data is fetched.
 *
 * Note: this renders with a normal 200 status. Returning a true HTTP 403 for
 * a page render requires Next.js's forbidden()/unauthorized() APIs, which
 * are still experimental (behind the `authInterrupts` flag) as of the
 * Next.js version this project is pinned to — see the implementation
 * summary for the recommended follow-up if an exact status code is needed
 * (e.g. for automated security scanning). Every API route in this app (e.g.
 * /api/leads/export) already returns a real 403 today, since route handlers
 * aren't subject to that limitation.
 */
export default function AccessDeniedPage() {
  return (
    <div className="grid place-items-center min-h-[60vh]">
      <div className="card p-8 max-w-md text-center">
        <div className="mx-auto mb-4 grid place-items-center w-12 h-12 rounded-full" style={{ background: 'var(--color-danger-bg)' }}>
          <ShieldAlert size={22} style={{ color: 'var(--color-danger)' }} aria-hidden="true" />
        </div>
        <p className="font-display font-semibold text-lg" style={{ color: 'var(--color-ink)' }}>
          Access denied
        </p>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-body)' }}>
          You don&apos;t have permission to view this page. If you believe this is a mistake, ask a Super Admin to
          review your permissions from Staff management.
        </p>
        <Link href="/admin" className="btn btn-primary mt-5 inline-flex">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
