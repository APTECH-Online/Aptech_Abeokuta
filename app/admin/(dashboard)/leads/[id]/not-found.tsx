import Link from 'next/link'

export const metadata = { title: 'Lead not found | Admissions CRM' }

export default function LeadNotFound() {
  return (
    <div className="card p-8 max-w-xl">
      <p className="eyebrow">Lead profile</p>
      <h1 className="h-section mt-1">Lead not found</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-body)' }}>
        This lead may have been deleted, merged, or you may not have permission to view it.
      </p>
      <Link href="/admin/leads" className="btn btn-secondary mt-5 inline-flex">Back to all leads</Link>
    </div>
  )
}
