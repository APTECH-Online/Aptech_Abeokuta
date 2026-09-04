import { BellRing } from 'lucide-react'

export const metadata = { title: 'Notifications | Admissions CRM' }

export default function NotificationsPage() {
  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Official Account</p>
        <h1 className="h-section mt-1">Notifications</h1>
      </div>

      <section className="card p-8 sm:p-10 text-center grid gap-3 justify-items-center">
        <BellRing size={28} style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
        <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>Nothing here yet</p>
        <p className="text-sm max-w-sm" style={{ color: 'var(--color-muted)' }}>
          System notifications — new enquiries, overdue follow-ups, and account activity — will
          appear here once this is wired up. For now, check Follow-ups and the Dashboard for
          what needs attention.
        </p>
      </section>
    </div>
  )
}
