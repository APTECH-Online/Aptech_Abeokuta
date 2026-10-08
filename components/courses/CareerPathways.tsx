'use client'

import { useEffect } from 'react'
import { BriefcaseBusiness, Check, Code2, GraduationCap, Info } from 'lucide-react'
import { trackConversionEvent } from '../../lib/conversion-events'
import type { Course } from '../../data/courses'

function careerDirection(course: Course) {
  const text = [course.title, course.category, course.summary, course.description, ...course.highlights, ...course.tools, ...course.outcomes].join(' ').toLowerCase()
  if (/data|analytics|sql|excel|ai|artificial intelligence/.test(text)) return 'Data, analytics and AI-related technology work'
  if (/cyber|security/.test(text)) return 'Cybersecurity and technology security work'
  if (/network|server|infrastructure/.test(text)) return 'Networking, systems and infrastructure work'
  if (/web|website|html|css|javascript/.test(text)) return 'Web and digital product development'
  if (/business|office|productivity/.test(text)) return 'Business, office and digital productivity work'
  return 'Software and technology development'
}

export default function CareerPathways({ course }: { course: Course }) {
  useEffect(() => {
    trackConversionEvent('career_pathway_viewed', { programmeSlug: course.slug, programmeTitle: course.title })
  }, [course.slug, course.title])

  const skills = course.outcomes.slice(0, 4)
  const tools = course.tools.slice(0, 4)

  return (
    <div className="pathway-grid">
      <PathwayCard icon={<GraduationCap size={20} aria-hidden="true" />} title="What you'll learn">
        {course.highlights.length > 0 && (
          <ul className="pathway-list">
            {course.highlights.slice(0, 4).map((item) => (
              <li key={item} className="pathway-item">
                <span className="pathway-check" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
        {!course.highlights.length && <Muted>Learning highlights have not been added yet.</Muted>}
      </PathwayCard>

      <PathwayCard icon={<Code2 size={20} aria-hidden="true" />} title="Skills you'll build">
        {skills.length > 0 && (
          <ul className="pathway-list">
            {skills.map((item) => (
              <li key={item} className="pathway-item">
                <span className="node-mark pathway-node" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
        {tools.length > 0 && (
          <div className="pathway-tools">
            <p className="pathway-subhead">Tools you'll use</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {tools.map((item) => <span key={`tool-${item}`} className="badge badge-navy">{item}</span>)}
            </div>
          </div>
        )}
        {!skills.length && !tools.length && <Muted>Skills information has not been added yet.</Muted>}
      </PathwayCard>

      <PathwayCard tone="dark" icon={<BriefcaseBusiness size={20} aria-hidden="true" />} title="Career directions to explore">
        <p className="pathway-direction">{careerDirection(course)}</p>
        <p className="pathway-disclaimer">
          <Info size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>Based on the programme information currently published. It is not a guarantee of employment, salary or placement.</span>
        </p>
      </PathwayCard>
    </div>
  )
}

function PathwayCard({ icon, title, children, tone = 'light' }: { icon: React.ReactNode; title: string; children: React.ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <article className={`pathway-card ${tone === 'dark' ? 'pathway-card-dark pattern-adire' : ''}`}>
      <header className="pathway-head">
        <span className="pathway-icon">{icon}</span>
        <h3 className="pathway-title">{title}</h3>
      </header>
      <div className="pathway-body">{children}</div>
    </article>
  )
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>{children}</p>
}
