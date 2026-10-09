import Link from 'next/link'
import { BookOpen, CalendarDays, LayoutGrid, Megaphone, Newspaper } from 'lucide-react'

const TABS = [
  { label: 'All Updates', href: '/insights', icon: LayoutGrid },
  { label: 'News', href: '/insights/news', icon: Newspaper },
  { label: 'Blog / Insights', href: '/insights/blog', icon: BookOpen },
  { label: 'Announcements', href: '/insights/announcements', icon: Megaphone },
  { label: 'Events', href: '/insights/events', icon: CalendarDays }
]

/**
 * Content-type navigation: a tab bar with an underlined active tab. Deliberately
 * styled differently from the category chips (InsightsTopics) so the two rows
 * read as two separate controls — "what kind of update" vs "which topic".
 */
export default function InsightsSubNav({ active }: { active: string }) {
  return (
    <nav className="ins-tabs" aria-label="Content type">
      <ul className="ins-tabs__list">
        {TABS.map(({ label, href, icon: Icon }) => {
          const isActive = href === active
          return (
            <li key={href}>
              <Link href={href} aria-current={isActive ? 'page' : undefined} className="ins-tab">
                <Icon size={16} aria-hidden="true" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
