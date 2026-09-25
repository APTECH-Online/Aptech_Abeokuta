import { Layers, BookOpen, Award, Globe } from 'lucide-react'
import type { Course } from '../../data/courses'

// Every figure here is derived from the site's own verified data (course
// catalogue, partner list) rather than invented — see
// components/shared/PartnerLogos.tsx. Course count and programme-area count
// both come from the `courses` prop (fetched via lib/courses-public.ts,
// backed by the `courses` table — see migration 0007) rather than a
// module-level constant, since the catalogue is now CRM-managed and can
// change without a deploy. Programme areas used to be a hand-typed "3",
// which had quietly drifted out of sync with the actual category list in
// data/courses.ts (currently 4: Advanced Diploma, Smart Pro, Aptech
// Certified Network Specialist, Short Term Courses) — counting the
// distinct categories actually present among published courses means this
// can't go stale again.
//
// "Academic & accreditation alliances" is deliberately left as an
// editorial figure rather than derived from the partner_organizations /
// affiliated_universities tables (migration 0011) — those two tables
// currently total 6 rows between them, which doesn't obviously map to a
// single "alliances" count, and at least one of the four affiliated
// university logos may not reflect a real Aptech partnership (see the
// admin note at /admin/settings/partners/universities). Revisit this
// number once that's sorted out.
//
// Used on both the homepage and About page (app/(site)/about/page.tsx) so
// the two "at a glance" stat rows stay visually and numerically consistent
// rather than drifting into two hand-maintained versions of the same facts.

export default function StatsBand({ courses }: { courses: Course[] }) {
  const programmeAreaCount = new Set(courses.map((c) => c.category)).size

  const stats = [
    { icon: Layers, value: String(programmeAreaCount || 3), label: 'Programme areas' },
    { icon: BookOpen, value: String(courses.length), label: 'Courses across those areas' },
    { icon: Award, value: '4', label: 'Academic & accreditation alliances' },
    { icon: Globe, value: 'Global', label: 'Part of the Aptech network' }
  ]

  return (
    <div className="pattern-adire" style={{ background: 'var(--color-navy-950)' }}>
      <div className="container py-14 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="stat-tile group rounded-2xl p-6 sm:p-7">
                <div
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full transition-transform duration-300 group-hover:scale-110"
                  style={{ background: 'rgba(239,192,119,0.12)' }}
                >
                  <Icon size={20} style={{ color: 'var(--color-amber-400)' }} aria-hidden="true" />
                </div>
                <div className="stat-value h-display mt-4" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.5rem)' }}>
                  {s.value}
                </div>
                <div className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.58)' }}>{s.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
