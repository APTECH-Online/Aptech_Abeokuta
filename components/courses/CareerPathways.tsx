'use client'

import { useEffect } from 'react'
import { BriefcaseBusiness, CheckCircle2, Code2, GraduationCap } from 'lucide-react'
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <PathwayCard icon={<GraduationCap size={19} aria-hidden="true" />} title="What you'll learn">
        {course.highlights.slice(0, 4).map((item) => <Item key={item}>{item}</Item>)}
        {!course.highlights.length && <Muted>Learning highlights have not been added yet.</Muted>}
      </PathwayCard>
      <PathwayCard icon={<Code2 size={19} aria-hidden="true" />} title="Skills you'll build">
        {skills.map((item) => <Item key={item}>{item}</Item>)}
        {tools.map((item) => <Item key={`tool-${item}`}>{item}</Item>)}
        {!skills.length && !tools.length && <Muted>Skills information has not been added yet.</Muted>}
      </PathwayCard>
      <PathwayCard icon={<BriefcaseBusiness size={19} aria-hidden="true" />} title="Career directions to explore">
        <Item>{careerDirection(course)}</Item>
        <Muted>Based on the programme information currently published. It is not a guarantee of employment, salary or placement.</Muted>
      </PathwayCard>
    </div>
  )
}

function PathwayCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <article className="card p-6">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-teal-50)', color: 'var(--color-teal-700)' }}>{icon}</div>
      <h3 className="mt-4 font-display font-semibold text-[var(--color-ink)]">{title}</h3>
      <div className="mt-4 space-y-2.5">{children}</div>
    </article>
  )
}

function Item({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed flex gap-2" style={{ color: 'var(--color-body)' }}><CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--color-teal-700)' }} aria-hidden="true" />{children}</p>
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>{children}</p>
}
