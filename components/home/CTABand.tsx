import Link from 'next/link'

export default function CTABand({
  title = 'Ready to start your technology career?',
  description = 'Talk to the admissions team about the right programme for your goals, or browse the full course catalogue.',
  primary = { label: 'Start your application', href: '/admissions' },
  secondary = { label: 'Browse courses', href: '/courses' }
}: {
  title?: string
  description?: string
  primary?: { label: string; href: string }
  secondary?: { label: string; href: string }
}) {
  return (
    <div
      className="card pattern-adire p-8 sm:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden"
      style={{ background: 'var(--color-navy-900)', borderColor: 'var(--color-navy-900)' }}
    >
      <svg
        aria-hidden="true"
        className="absolute -right-10 -top-10 w-56 h-56 opacity-20 pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
      >
        <rect x="30" y="30" width="140" height="140" stroke="#EFC077" strokeWidth="1.5" transform="rotate(45 100 100)" />
        <rect x="60" y="60" width="80" height="80" stroke="#EFC077" strokeWidth="1.5" transform="rotate(45 100 100)" />
      </svg>
      <div className="max-w-xl relative">
        <h2 className="h-section" style={{ color: '#fff' }}>{title}</h2>
        <p className="mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{description}</p>
      </div>
      <div className="flex flex-wrap gap-3 shrink-0 relative">
        <Link href={primary.href} className="btn btn-accent">{primary.label}</Link>
        <Link href={secondary.href} className="btn btn-secondary" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>{secondary.label}</Link>
      </div>
    </div>
  )
}
