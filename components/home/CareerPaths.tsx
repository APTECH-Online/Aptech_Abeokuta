import Link from 'next/link'
import { Code2, Network, BarChart3, BookOpen, ArrowRight, Check, Clock } from 'lucide-react'
import IconTile from '../ui/IconTile'
import { getCareerDirection } from '../../lib/program-recommendation'
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

const ICONS: Record<string, typeof Code2> = {
  'advanced-diploma-software-engineering': Code2,
  'smart-pro': BarChart3,
  'aptech-certified-network-specialist': Network
}
// Courses without a dedicated icon (anything staff feature later) get this one.
const FALLBACK_ICON = BookOpen

export default function CareerPaths({ courses }: { courses: Course[] }) {
  // Featured in the CRM ("Show on homepage"); the fixed slug list is only the
  // fallback before migration 0023 exists or while nothing is flagged.
  const featured = courses.filter((c) => c.featuredHome).slice(0, 3)
  const flagships = featured.length > 0
    ? featured
    : FLAGSHIP_SLUGS.map((slug) => courses.find((c) => c.slug === slug)).filter((c): c is NonNullable<typeof c> => Boolean(c))

  if (flagships.length === 0) return null

  return (
    <ul className="path-grid">
      {flagships.map((course, i) => {
        const Icon = ICONS[course.slug] ?? FALLBACK_ICON
        return (
          <li key={course.slug} className="path-card">
            <div className="path-card__top">
              <IconTile icon={Icon} size="lg" tone={i % 3 === 1 ? 'teal' : i % 3 === 2 ? 'amber' : 'navy'} />
              <span className="path-card__tag">{course.category}</span>
            </div>
            <h3 className="path-card__title">
              <Link href={`/courses/${course.slug}`} className="path-card__link">{course.title}</Link>
            </h3>
            <p className="path-card__meta">
              <Clock size={13} aria-hidden="true" /> {course.duration}
              {course.level && <><span aria-hidden="true">·</span>{course.level}</>}
            </p>
            <p className="path-card__direction">{getCareerDirection(course)}</p>
            <ul className="path-card__outcomes">
              {course.outcomes.slice(0, 3).map((o) => (
                <li key={o}>
                  <span className="path-card__tick" aria-hidden="true"><Check size={11} strokeWidth={3} /></span>
                  {o}
                </li>
              ))}
            </ul>
            <span className="path-card__cta" aria-hidden="true">Explore this path <ArrowRight size={15} /></span>
          </li>
        )
      })}
    </ul>
  )
}
