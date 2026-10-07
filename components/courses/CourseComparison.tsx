'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, ChevronDown, GitCompareArrows, MessageCircle, X } from 'lucide-react'
import type { Course } from '../../data/courses'
import { admissionUi } from '../../lib/admission'
import { trackConversionEvent } from '../../lib/conversion-events'

type Props = {
  courses: Course[]
  initialSlugs: string[]
}

function safeInitial(slugs: string[], courses: Course[]) {
  const unique = Array.from(new Set(slugs)).filter((slug) => courses.some((course) => course.slug === slug))
  return unique.slice(0, 3)
}

export default function CourseComparison({ courses, initialSlugs }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState(() => safeInitial(initialSlugs, courses))
  const [openCategory, setOpenCategory] = useState<string | null>('overview')
  const trackedAdds = useRef(new Set<string>())
  const trackedRemoves = useRef(new Set<string>())
  const trackedCompleted = useRef(false)

  const selectedCourses = useMemo(
    () => selected.map((slug) => courses.find((course) => course.slug === slug)).filter((course): course is Course => Boolean(course)),
    [courses, selected]
  )

  useEffect(() => {
    trackConversionEvent('comparison_started', { programmeSlugs: selected })
  }, []) // page-entry event only

  useEffect(() => {
    const params = new URLSearchParams()
    if (selected.length) params.set('programmes', selected.join(','))
    router.replace(`/courses/compare${params.toString() ? `?${params}` : ''}`, { scroll: false })
  }, [selected, router])

  useEffect(() => {
    if (selected.length >= 2 && !trackedCompleted.current) {
      trackedCompleted.current = true
      trackConversionEvent('comparison_completed', {
        programmeSlugs: selected,
        programmeCount: selected.length
      })
    }
  }, [selected])

  function toggle(slug: string) {
    if (selected.includes(slug)) {
      setSelected((current) => current.filter((item) => item !== slug))
      if (!trackedRemoves.current.has(slug)) {
        trackedRemoves.current.add(slug)
        trackConversionEvent('comparison_programme_removed', { programmeSlug: slug })
      }
      return
    }
    if (selected.length >= 3) return
    setSelected((current) => [...current, slug])
    if (!trackedAdds.current.has(slug)) {
      trackedAdds.current.add(slug)
      trackConversionEvent('comparison_programme_added', { programmeSlug: slug })
    }
  }

  function clear() {
    selected.forEach((slug) => {
      if (!trackedRemoves.current.has(slug)) {
        trackedRemoves.current.add(slug)
        trackConversionEvent('comparison_programme_removed', { programmeSlug: slug })
      }
    })
    setSelected([])
  }

  if (selectedCourses.length < 2) {
    return (
      <div>
        <div className="card p-5 sm:p-6" style={{ background: 'var(--color-paper-alt)' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-teal-50)', color: 'var(--color-teal-700)' }}>
              <GitCompareArrows size={19} aria-hidden="true" />
            </div>
            <div>
              <p className="eyebrow">Compare programmes</p>
              <h2 className="h-section mt-1" style={{ fontSize: '1.35rem' }}>Choose 2–3 programmes to compare</h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                Select the options you are considering. The comparison uses the programme information currently published by APTECH Abeokuta.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="group" aria-label="Select programmes to compare">
          {courses.map((course) => {
            const checked = selected.includes(course.slug)
            const disabled = !checked && selected.length >= 3
            return (
              <button
                key={course.slug}
                type="button"
                onClick={() => toggle(course.slug)}
                disabled={disabled}
                aria-pressed={checked}
                className="card p-5 text-left transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                style={{ borderColor: checked ? 'var(--color-teal-700)' : 'var(--color-line)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">{course.category}</p>
                    <h3 className="mt-1 font-display font-semibold text-[var(--color-ink)]">{course.title}</h3>
                  </div>
                  <span className="w-7 h-7 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: checked ? 'var(--color-teal-700)' : 'var(--color-line)', background: checked ? 'var(--color-teal-700)' : 'transparent', color: checked ? '#fff' : 'transparent' }}>
                    <Check size={15} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-sm line-clamp-2" style={{ color: 'var(--color-body)' }}>{course.summary}</p>
                <p className="mt-3 text-xs" style={{ color: 'var(--color-muted)' }}>{course.duration} · {course.level}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{selected.length}/3 selected</span>
          {selected.length > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>Clear</button>}
          {selected.length === 1 && <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Select one more programme to start the comparison.</p>}
        </div>

        <div className="mt-10 card p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <p className="font-semibold text-[var(--color-ink)]">Not sure which one fits?</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>Use the existing Programme Discovery Quiz for a personalized recommendation.</p>
          </div>
          <Link href="/#programme-discovery" className="btn btn-secondary shrink-0">
            Take the discovery quiz <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    )
  }

  const row = (label: string, values: ReactNode[]) => (
    <div className="grid min-w-[720px]" style={{ gridTemplateColumns: `minmax(170px, 0.7fr) repeat(${selectedCourses.length}, minmax(210px, 1fr))` }}>
      <div className="p-4 font-semibold text-sm border-b" style={{ color: 'var(--color-ink)', borderColor: 'var(--color-line)' }}>{label}</div>
      {values.map((value, index) => (
        <div key={selectedCourses[index].slug} className="p-4 text-sm leading-relaxed border-b border-l" style={{ color: 'var(--color-body)', borderColor: 'var(--color-line)' }}>{value}</div>
      ))}
    </div>
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Your shortlist</p>
          <h2 className="h-section mt-1" style={{ fontSize: '1.5rem' }}>Compare programmes side by side</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>Showing {selectedCourses.length} of up to 3 selected programmes.</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={clear}><X size={15} aria-hidden="true" /> Change selection</button>
      </div>

      <div className="mt-6 space-y-3 md:hidden">
        {selectedCourses.map((course) => (
          <article key={course.slug} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{course.category}</p>
                <h3 className="mt-1 font-display font-semibold text-[var(--color-ink)]">{course.title}</h3>
              </div>
              <button type="button" className="btn btn-ghost btn-sm !p-2" onClick={() => toggle(course.slug)} aria-label={`Remove ${course.title} from comparison`}><X size={16} /></button>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <Metric label="Duration" value={course.duration} />
              <Metric label="Level" value={course.level} />
              <Metric label="Format" value={course.mode} />
              <Metric label="Certification" value={course.certification} />
            </dl>
            <CompareDetails course={course} />
          </article>
        ))}
      </div>

      <div className="hidden md:block mt-6 overflow-x-auto border rounded-xl" style={{ borderColor: 'var(--color-line)' }}>
        <div className="min-w-[720px]">
          <div className="grid sticky top-0 z-10 bg-[var(--color-paper)]" style={{ gridTemplateColumns: `minmax(170px, 0.7fr) repeat(${selectedCourses.length}, minmax(210px, 1fr))` }}>
            <div className="p-4 font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>Programme</div>
            {selectedCourses.map((course) => (
              <div key={course.slug} className="p-4 border-l" style={{ borderColor: 'var(--color-line)' }}>
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/courses/${course.slug}`} className="font-display font-semibold text-sm hover:underline text-[var(--color-ink)]">{course.title}</Link>
                  <button type="button" className="text-[var(--color-muted)] hover:text-[var(--color-ink)]" onClick={() => toggle(course.slug)} aria-label={`Remove ${course.title}`}><X size={15} /></button>
                </div>
              </div>
            ))}
          </div>

          <ComparisonCategory label="Overview" open={openCategory === 'overview'} onToggle={() => setOpenCategory(openCategory === 'overview' ? null : 'overview')}>
            {row('Description', selectedCourses.map((c) => c.description || c.summary))}
            {row('Duration', selectedCourses.map((c) => c.duration))}
            {row('Level', selectedCourses.map((c) => c.level))}
            {row('Learning format', selectedCourses.map((c) => c.mode))}
            {row('Admission status', selectedCourses.map((c) => admissionUi(c.admissionStatus).statusLabel))}
          </ComparisonCategory>

          <ComparisonCategory label="What you'll learn" open={openCategory === 'learning'} onToggle={() => setOpenCategory(openCategory === 'learning' ? null : 'learning')}>
            {row('Skills / outcomes', selectedCourses.map((c) => c.outcomes.length ? <ul className="space-y-1">{c.outcomes.map((x) => <li key={x}>• {x}</li>)}</ul> : 'Not provided'))}
            {row('Core highlights', selectedCourses.map((c) => c.highlights.length ? <ul className="space-y-1">{c.highlights.map((x) => <li key={x}>• {x}</li>)}</ul> : 'Not provided'))}
            {row('Tools / technologies', selectedCourses.map((c) => c.tools.length ? <ul className="space-y-1">{c.tools.map((x) => <li key={x}>• {x}</li>)}</ul> : 'Not provided'))}
          </ComparisonCategory>

          <ComparisonCategory label="Who it's for" open={openCategory === 'fit'} onToggle={() => setOpenCategory(openCategory === 'fit' ? null : 'fit')}>
            {row('Suitable learner', selectedCourses.map((c) => c.audience || 'Not provided'))}
            {row('Entry requirements', selectedCourses.map((c) => c.prerequisites || 'Not provided'))}
          </ComparisonCategory>

          <ComparisonCategory label="Career direction" open={openCategory === 'career'} onToggle={() => setOpenCategory(openCategory === 'career' ? null : 'career')}>
            {row('Areas to explore', selectedCourses.map((c) => <div><p>{careerDirection(c)}</p><p className="mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>Based on the skills and outcomes published for this programme; not an employment guarantee.</p></div>))}
            {row('Certification', selectedCourses.map((c) => c.certification || 'Not provided'))}
          </ComparisonCategory>

          <ComparisonCategory label="Next step" open={openCategory === 'next'} onToggle={() => setOpenCategory(openCategory === 'next' ? null : 'next')}>
            {row('Programme', selectedCourses.map((c) => <Link href={`/courses/${c.slug}`} className="font-semibold underline">View programme</Link>))}
          </ComparisonCategory>
        </div>
      </div>

      <div className="mt-8 card p-6 sm:p-7">
        <p className="eyebrow">Still deciding?</p>
        <h2 className="h-section mt-2" style={{ fontSize: '1.35rem' }}>Get guidance from an academic advisor</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
          If the published information does not answer your question, the admissions team can help you understand the programme options and current admission details.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/contact?source=advisor_request" className="btn btn-secondary" onClick={() => trackConversionEvent('advisor_cta_clicked', { from: 'programme_comparison', programmeSlugs: selected })}>
            <MessageCircle size={15} aria-hidden="true" /> Talk to an Advisor
          </Link>
          <Link href={`/admissions?source=programme_comparison&programmes=${encodeURIComponent(selected.join(','))}`} className="btn btn-primary" onClick={() => {
            trackConversionEvent('comparison_cta_clicked', { action: 'enquiry', programmeSlugs: selected })
            trackConversionEvent('enquiry_cta_clicked', { from: 'programme_comparison', programmeSlugs: selected })
          }}>
            Enquire about these programmes <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div>
      <dt className="eyebrow" style={{ fontSize: '0.62rem' }}>{label}</dt>
      <dd className="mt-1 text-sm" style={{ color: 'var(--color-ink)' }}>{value}</dd>
    </div>
  )
}

function CompareDetails({ course }: { course: Course }) {
  return (
    <div className="mt-6 space-y-5">
      <DetailBlock title="What you'll learn" items={course.outcomes} />
      <DetailBlock title="Tools & technologies" items={course.tools} />
      <DetailBlock title="Who it's for" items={course.audience ? [course.audience] : []} fallback={!course.audience ? 'Not provided' : undefined} />
      <DetailBlock title="Entry requirements" items={course.prerequisites ? [course.prerequisites] : []} fallback={!course.prerequisites ? 'Not provided' : undefined} />
      <div>
        <p className="eyebrow">Career direction</p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>{careerDirection(course)}</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>This describes areas the published skillset may support; it is not a placement or employment claim.</p>
      </div>
      <div className="pt-4 border-t" style={{ borderColor: 'var(--color-line)' }}>
        <Link href={`/courses/${course.slug}`} className="btn btn-secondary btn-sm">View programme</Link>
      </div>
    </div>
  )
}

function DetailBlock({ title, items, fallback }: { title: string; items: string[]; fallback?: string }) {
  if (!items.length && !fallback) return null
  return (
    <div>
      <p className="eyebrow">{title}</p>
      {items.length ? (
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
          {items.map((item) => <li key={item}>• {item}</li>)}
        </ul>
      ) : <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>{fallback}</p>}
    </div>
  )
}

function ComparisonCategory({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <section>
      <button type="button" className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left font-semibold border-t" style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink)' }} onClick={onToggle} aria-expanded={open}>
        <span>{label}</span>
        <ChevronDown size={17} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && children}
    </section>
  )
}

function careerDirection(course: Course) {
  const text = [course.title, course.category, course.summary, course.description, ...course.highlights, ...course.tools, ...course.outcomes].join(' ').toLowerCase()
  if (/data|analytics|sql|excel|ai|artificial intelligence/.test(text)) return 'Data, analytics and AI-related technology work'
  if (/cyber|security/.test(text)) return 'Cybersecurity and technology security work'
  if (/network|server|infrastructure/.test(text)) return 'Networking, systems and infrastructure work'
  if (/web|website|html|css|javascript/.test(text)) return 'Web and digital product development'
  if (/business|office|productivity/.test(text)) return 'Business, office and digital productivity work'
  return 'Software and technology development'
}
