import { Layers, BookOpen, Award, Globe } from 'lucide-react'
import type { Course } from '../../data/courses'

export default function StatsBand({ courses }: { courses: Course[] }) {
  const programmeAreaCount = new Set(courses.map((c) => c.category)).size
  const stats = [
    { icon: Layers, value: String(programmeAreaCount || 4), label: 'Programme Areas' },
    { icon: BookOpen, value: String(courses.length), label: 'Courses across those areas' },
    { icon: Award, value: '4', label: 'Academic & accreditation alliances' },
    { icon: Globe, value: 'Global', label: 'Part of the Aptech network' }
  ]

  return (
    <section className="hero-stats" aria-label="Aptech Abeokuta at a glance">
      <div className="container py-5 sm:py-7">
        <div className="hero-stats__grid">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="hero-stat">
                <div className="hero-stat__icon"><Icon size={21} aria-hidden="true" /></div>
                <div className="min-w-0">
                  <div className="hero-stat__value">{s.value}</div>
                  <div className="hero-stat__label">{s.label}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
