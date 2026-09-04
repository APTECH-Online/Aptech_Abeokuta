import { redirect } from 'next/navigation'
import { getSessionAndStaff } from '../../../lib/auth'
import AdminShell from '../../../components/admin/AdminShell'
import { signOut } from '../actions'

export const metadata = {
  robots: { index: false, follow: false }
}

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { hasSession, staff } = await getSessionAndStaff()

  if (!hasSession) {
    redirect('/admin/login')
  }

  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-navy-950)' }}>
        <div className="card p-8 max-w-md text-center">
          <p className="font-display font-semibold text-lg" style={{ color: 'var(--color-ink)' }}>
            Access not yet set up
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-body)' }}>
            Your account is signed in, but doesn&apos;t have CRM access yet, or has been deactivated.
            Ask a Super Admin to add you as staff.
          </p>
          <form action={signOut} className="mt-5">
            <button type="submit" className="btn btn-secondary">Logout</button>
          </form>
        </div>
      </div>
    )
  }

  return <AdminShell staff={staff}>{children}</AdminShell>
}
