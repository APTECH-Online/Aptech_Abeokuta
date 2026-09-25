import Link from 'next/link'

const TABS = [
  { label: 'All Updates', href: '/insights' },
  { label: 'News', href: '/insights/news' },
  { label: 'Blog / Insights', href: '/insights/blog' },
  { label: 'Announcements', href: '/insights/announcements' },
  { label: 'Events', href: '/insights/events' }
]

export default function InsightsSubNav({ active }: { active: string }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Content type">
      {TABS.map((tab) => {
        const isActive = tab.href === active
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors"
            style={{
              background: isActive ? 'var(--color-navy-900)' : 'var(--color-navy-50)',
              color: isActive ? '#fff' : 'var(--color-navy-900)'
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
