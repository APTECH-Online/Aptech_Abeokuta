import Link from 'next/link'
import { Code2, Network, BarChart3, ArrowRight } from 'lucide-react'
import type { Course } from '../../data/courses'

/**
 * Every skill/outcome/duration shown here comes from the `courses` prop
 * (fetched via lib/courses-public.ts, backed by the `courses` table — see
 * migration 0007) — nothing here is invented. This deliberately mirrors
 * each flagship programme's own `outcomes` array rather than introducing a
 * separate "career paths" taxonomy the data model doesn't actually have.
 */
const FLAGSHIP_SLUGS = [
  'advanced-diploma-software-engineering',
  'smart-pro',
  'aptech-certified-network-specialist'
] as const

const ICONS: Record<(typeof FLAGSHIP_SLUGS)[number], typeof Code2> = {
  'advanced-diploma-software-engineering': Code2,
  'smart-pro': BarChart3,
  'aptech-certified-network-specialist': Network
}

export default function CareerPaths({ courses }: { courses: Course[] }) {
  const flagships = FLAGSHIP_SLUGS.map((slug) => courses.find((c) => c.slug === slug)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c)
  )

  if (flagships.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
      {flagships.map((course) => {
        const Icon = ICONS[course.slug as (typeof FLAGSHIP_SLUGS)[number]]
        return (
          <div key={course.slug} className="card p-7 flex flex-col">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-teal-50)', color: 'var(--color-teal-700)' }}
            >
              <Icon aria-hidden="true" className="w-5 h-5" />
            </div>
            <h3 className="mt-4 font-display font-semibold text-[1.02rem] text-[var(--color-ink)]">
              {course.title}
            </h3>
            <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
              {course.duration}
            </p>
            <ul className="mt-4 space-y-2 flex-1">
              {course.outcomes.slice(0, 3).map((o) => (
                <li key={o} className="text-sm leading-relaxed flex gap-2" style={{ color: 'var(--color-body)' }}>
                  <span aria-hidden="true" className="mt-2 w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--color-amber-500)' }} />
                  {o}
                </li>
              ))}
            </ul>
            <Link
              href={`/courses/${course.slug}`}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: 'var(--color-navy-900)' }}
            >
              Explore this path
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        )
      })}
    </div>
  )
}
