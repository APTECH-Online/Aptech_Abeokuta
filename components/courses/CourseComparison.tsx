'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Link2, MessageCircle, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import type { Course } from '../../data/courses'
import { admissionUi } from '../../lib/admission'
import { trackConversionEvent } from '../../lib/conversion-events'
import { COMPARE_MAX, getCompareSlugs, setCompareSlugs } from '../../lib/compare-store'

type Props = {
  courses: Course[]
  initialSlugs: string[]
  /** Legacy `?add=<slug>` link: merged into the saved shortlist instead of replacing it. */
  addSlug?: string
}

type Val = string | string[] | null
type Row = { key: string; label: string; kind: 'text' | 'list' | 'status'; get: (c: Course) => Val }
type Section = { id: string; title: string; rows: Row[] }

const text = (v?: string) => (v && v.trim() ? v.trim() : null)
const list = (v?: string[]) => (v && v.length ? v : null)

const SECTIONS: Section[] = [
  {
    id: 'overview',
    title: 'Overview',
    rows: [
      { key: 'about', label: 'About', kind: 'text', get: (c) => text(c.description) ?? text(c.summary) },
      { key: 'category', label: 'Category', kind: 'text', get: (c) => text(c.category) },
      { key: 'duration', label: 'Duration', kind: 'text', get: (c) => text(c.duration) },
      { key: 'level', label: 'Level', kind: 'text', get: (c) => text(c.level) },
      { key: 'mode', label: 'Learning format', kind: 'text', get: (c) => text(c.mode) },
      { key: 'status', label: 'Admission status', kind: 'status', get: (c) => admissionUi(c.admissionStatus).statusLabel },
      { key: 'intake', label: 'Intake information', kind: 'text', get: (c) => text(c.intakeNote) },
      { key: 'cert', label: 'Certification', kind: 'text', get: (c) => text(c.certification) }
    ]
  },
  {
    id: 'learning',
    title: "What you'll learn",
    rows: [
      { key: 'outcomes', label: 'Skills & outcomes', kind: 'list', get: (c) => list(c.outcomes) },
      { key: 'highlights', label: 'Programme highlights', kind: 'list', get: (c) => list(c.highlights) },
      { key: 'tools', label: 'Tools & technologies', kind: 'list', get: (c) => list(c.tools) }
    ]
  },
  {
    id: 'fit',
    title: "Who it's for",
    rows: [
      { key: 'audience', label: 'Suitable learner', kind: 'text', get: (c) => text(c.audience) },
      { key: 'prereq', label: 'Entry requirements', kind: 'text', get: (c) => text(c.prerequisites) }
    ]
  },
  {
    id: 'career',
    title: 'Career direction',
    rows: [{ key: 'career', label: 'Areas to explore', kind: 'text', get: (c) => careerDirection(c) }]
  }
]

const STATUS_STYLE: Record<Course['admissionStatus'], { bg: string; fg: string }> = {
  open: { bg: 'var(--color-teal-50)', fg: 'var(--color-teal-700)' },
  coming_soon: { bg: 'var(--color-amber-100)', fg: 'var(--color-amber-700)' },
  closed: { bg: 'var(--color-danger-bg)', fg: 'var(--color-danger)' }
}

function safeInitial(slugs: string[], courses: Course[]) {
  const unique = Array.from(new Set(slugs)).filter((slug) => courses.some((course) => course.slug === slug))
  return unique.slice(0, COMPARE_MAX)
}

const sameValue = (values: Val[]) => {
  const first = JSON.stringify(values[0])
  return values.every((v) => JSON.stringify(v) === first)
}

export default function CourseComparison({ courses, initialSlugs, addSlug }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState(() => safeInitial(addSlug ? [...initialSlugs, addSlug] : initialSlugs, courses))
  // Becomes true after the saved shortlist (localStorage) has been merged in on
  // the client; until then we must not write back, or we would overwrite it.
  const [ready, setReady] = useState(false)
  const [picking, setPicking] = useState(false)
  const [query, setQuery] = useState('')
  const [onlyDiffs, setOnlyDiffs] = useState(false)
  const [copied, setCopied] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const trackedAdds = useRef(new Set<string>())
  const trackedRemoves = useRef(new Set<string>())
  const trackedCompleted = useRef(false)

  const selectedCourses = useMemo(
    () => selected.map((slug) => courses.find((course) => course.slug === slug)).filter((course): course is Course => Boolean(course)),
    [courses, selected]
  )
  const showPicker = picking || selectedCourses.length < 2
  const canCompare = selectedCourses.length >= 2

  useEffect(() => {
    trackConversionEvent('comparison_started', { programmeSlugs: selected })
  }, []) // page-entry event only

  // Load the cross-page shortlist. An explicit ?programmes= list (a shared or
  // tray link) wins; otherwise use what the visitor saved on other pages.
  useEffect(() => {
    const fromUrl = safeInitial(initialSlugs, courses)
    let next = fromUrl.length ? fromUrl : safeInitial(getCompareSlugs(), courses)
    if (addSlug && courses.some((c) => c.slug === addSlug) && !next.includes(addSlug) && next.length < COMPARE_MAX) next = [...next, addSlug]
    setSelected(next)
    setCompareSlugs(next)
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // once, on entry

  // Persist changes so the selection survives refresh, new tabs and navigation.
  useEffect(() => {
    if (ready) setCompareSlugs(selected)
  }, [selected, ready])

  useEffect(() => {
    const params = new URLSearchParams()
    if (selected.length) params.set('programmes', selected.join(','))
    router.replace(`/courses/compare${params.toString() ? `?${params}` : ''}`, { scroll: false })
  }, [selected, router])

  useEffect(() => {
    if (selected.length >= 2 && !trackedCompleted.current) {
      trackedCompleted.current = true
      trackConversionEvent('comparison_completed', { programmeSlugs: selected, programmeCount: selected.length })
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
    if (selected.length >= COMPARE_MAX) return
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
    setPicking(true)
  }

  function openPicker() {
    setPicking(true)
    window.setTimeout(() => {
      pickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      searchRef.current?.focus({ preventScroll: true })
    }, 40)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/courses/compare?programmes=${selected.join(',')}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
      trackConversionEvent('comparison_cta_clicked', { action: 'copy_link', programmeSlugs: selected })
    } catch {
      /* clipboard unavailable: the address bar already holds the shareable URL */
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return courses
    return courses.filter((c) => `${c.title} ${c.category} ${c.level} ${c.duration}`.toLowerCase().includes(q))
  }, [courses, query])

  // Rows with at least one published value; flag the ones identical across programmes.
  const sections = useMemo(() => {
    return SECTIONS.map((section) => {
      const rows = section.rows
        .map((row) => {
          const values = selectedCourses.map((c) => row.get(c))
          return { row, values, hasData: values.some((v) => v !== null), shared: values.length > 1 && sameValue(values) }
        })
        .filter((r) => r.hasData)
      return { ...section, rows }
    }).filter((s) => s.rows.length)
  }, [selectedCourses])

  const sharedCount = sections.reduce((n, s) => n + s.rows.filter((r) => r.shared).length, 0)
  const visibleSections = useMemo(
    () => sections.map((s) => ({ ...s, rows: onlyDiffs ? s.rows.filter((r) => !r.shared) : s.rows })).filter((s) => s.rows.length),
    [sections, onlyDiffs]
  )

  return (
    <div className="cmp">
      {/* ── Shortlist ─────────────────────────────────────────────── */}
      <div className="cmp-shortlist card">
        <div className="cmp-shortlist__head">
          <div className="min-w-0">
            <p className="eyebrow">Your shortlist</p>
            <h2 className="cmp-title">
              {canCompare ? 'Comparing programmes' : selectedCourses.length === 1 ? 'Add one more programme' : 'Choose 2–3 programmes to compare'}
            </h2>
            <p className="cmp-sub">
              {canCompare
                ? `${selectedCourses.length} of ${COMPARE_MAX} programmes selected. Everything below comes from the information APTECH Abeokuta has published.`
                : 'Select the options you are considering. The comparison uses the programme details currently published by APTECH Abeokuta.'}
            </p>
          </div>
          {selectedCourses.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm cmp-clear" onClick={clear}>Clear all</button>
          )}
        </div>

        <ul className="cmp-slots" aria-label="Selected programmes">
          {Array.from({ length: COMPARE_MAX }).map((_, i) => {
            const course = selectedCourses[i]
            return course ? (
              <li key={course.slug} className="cmp-slot is-filled">
                <span className="cmp-badge" data-i={i}>{String.fromCharCode(65 + i)}</span>
                <span className="cmp-slot__name" title={course.title}>{course.title}</span>
                <button type="button" className="cmp-icon-btn" onClick={() => toggle(course.slug)} aria-label={`Remove ${course.title} from comparison`}>
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            ) : (
              <li key={`empty-${i}`} className="cmp-slot">
                <button type="button" className="cmp-slot__add" onClick={openPicker} aria-label="Add a programme to compare">
                  <Plus size={16} aria-hidden="true" /> Add a programme
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* ── Picker ────────────────────────────────────────────────── */}
      {showPicker && (
        <div className="cmp-picker card" ref={pickerRef}>
          <div className="cmp-picker__bar">
            <label className="cmp-search">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search programmes</span>
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search programmes"
                className="cmp-search__input"
                autoComplete="off"
              />
            </label>
            <span className="cmp-count" aria-live="polite">{selected.length}/{COMPARE_MAX} selected</span>
            {canCompare && <button type="button" className="btn btn-primary btn-sm" onClick={() => setPicking(false)}>Done</button>}
          </div>

          {filtered.length === 0 ? (
            <p className="cmp-empty">No programmes match “{query}”. Try a different word.</p>
          ) : (
            <div className="cmp-options" role="group" aria-label="Select programmes to compare">
              {filtered.map((course) => {
                const checked = selected.includes(course.slug)
                const disabled = !checked && selected.length >= COMPARE_MAX
                return (
                  <button
                    key={course.slug}
                    type="button"
                    onClick={() => toggle(course.slug)}
                    disabled={disabled}
                    aria-pressed={checked}
                    className={`cmp-option${checked ? ' is-checked' : ''}`}
                  >
                    <span className="cmp-option__check" aria-hidden="true"><Check size={14} /></span>
                    <span className="cmp-option__body">
                      <span className="cmp-option__cat">{course.category}</span>
                      <span className="cmp-option__title">{course.title}</span>
                      <span className="cmp-option__meta">{[course.duration, course.level].filter(Boolean).join(' · ')}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          {selected.length >= COMPARE_MAX && <p className="cmp-note">You can compare up to {COMPARE_MAX} programmes. Remove one to add another.</p>}
        </div>
      )}

      {/* ── Empty / one selected ──────────────────────────────────── */}
      {!canCompare && (
        <div className="cmp-help card">
          <div>
            <p className="font-semibold text-[var(--color-ink)]">Not sure which one fits?</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>Take the programme discovery quiz for a personalised recommendation, or browse the full catalogue.</p>
          </div>
          <div className="cmp-help__actions">
            <Link href="/courses" className="btn btn-secondary">Browse courses</Link>
            <Link href="/#programme-discovery" className="btn btn-ghost">Take the quiz <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────── */}
      {canCompare && (
        <>
          <div className="cmp-toolbar">
            <div className="min-w-0">
              <p className="eyebrow">Side by side</p>
              <h2 className="cmp-title">Compare at a glance</h2>
            </div>
            <div className="cmp-toolbar__actions">
              <label className="cmp-switch">
                <input type="checkbox" checked={onlyDiffs} onChange={(e) => setOnlyDiffs(e.target.checked)} disabled={sharedCount === 0} />
                <span className="cmp-switch__track" aria-hidden="true" />
                <span className="cmp-switch__label"><SlidersHorizontal size={14} aria-hidden="true" /> Differences only{sharedCount ? ` (${sharedCount} hidden)` : ''}</span>
              </label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={openPicker}><Plus size={15} aria-hidden="true" /> Edit selection</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={copyLink} aria-live="polite">
                {copied ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />} {copied ? 'Link copied' : 'Copy link'}
              </button>
            </div>
          </div>

          {/* Mobile + tablet: attribute-first cards with a sticky programme legend */}
          <div className="cmp-stack">
            <ul className="cmp-legend" style={{ gridTemplateColumns: `repeat(${selectedCourses.length}, minmax(0, 1fr))` }} aria-label="Programme key">
              {selectedCourses.map((course, i) => (
                <li key={course.slug} className="cmp-legend__item" title={course.title}>
                  <span className="cmp-badge" data-i={i}>{String.fromCharCode(65 + i)}</span>
                  <span className="cmp-legend__name">{course.title}</span>
                </li>
              ))}
            </ul>

            <div className="cmp-heads" style={{ ['--n' as string]: selectedCourses.length }}>
              {selectedCourses.map((course, i) => (
                <ProgrammeHead key={course.slug} course={course} index={i} onRemove={() => toggle(course.slug)} />
              ))}
            </div>

            {visibleSections.length === 0 ? (
              <p className="cmp-empty card">The selected programmes publish the same details, so there are no differences to show. Turn off “Differences only” to see them.</p>
            ) : visibleSections.map((section) => (
              <section key={section.id} className="cmp-block card" aria-labelledby={`cmp-${section.id}`}>
                <h3 id={`cmp-${section.id}`} className="cmp-block__title">{section.title}</h3>
                {section.rows.map(({ row, values, shared }) => (
                  <div key={row.key} className="cmp-attr">
                    <p className="cmp-attr__label">{row.label}{shared && <span className="cmp-same">Same</span>}</p>
                    <div className="cmp-attr__cells" style={{ ['--n' as string]: selectedCourses.length }}>
                      {values.map((value, i) => (
                        <div key={selectedCourses[i].slug} className="cmp-cell">
                          <span className="cmp-badge" data-i={i} aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                          <div className="cmp-cell__value">
                            <span className="sr-only">{selectedCourses[i].title}: </span>
                            <CellValue row={row} value={value} course={selectedCourses[i]} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}

            <div className="cmp-ctas" style={{ ['--n' as string]: selectedCourses.length }}>
              {selectedCourses.map((course, i) => (
                <ProgrammeActions key={course.slug} course={course} index={i} />
              ))}
            </div>
          </div>

          {/* Desktop: comparison table with sticky programme header */}
          <div className="cmp-table-wrap card">
            <table className="cmp-table">
              <caption className="sr-only">Side-by-side comparison of {selectedCourses.map((c) => c.title).join(', ')}</caption>
              <colgroup>
                <col className="cmp-table__labelcol" />
                {selectedCourses.map((c) => <col key={c.slug} />)}
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className="cmp-table__corner"><span className="sr-only">Attribute</span></th>
                  {selectedCourses.map((course, i) => (
                    <th key={course.slug} scope="col" className="cmp-table__head">
                      <ProgrammeHead course={course} index={i} onRemove={() => toggle(course.slug)} compact />
                    </th>
                  ))}
                </tr>
              </thead>
              {visibleSections.length === 0 ? (
                <tbody><tr><td colSpan={selectedCourses.length + 1} className="cmp-empty">The selected programmes publish the same details, so there are no differences to show. Turn off “Differences only” to see them.</td></tr></tbody>
              ) : visibleSections.map((section) => (
                <tbody key={section.id}>
                  <tr><th scope="colgroup" colSpan={selectedCourses.length + 1} className="cmp-table__section">{section.title}</th></tr>
                  {section.rows.map(({ row, values, shared }) => (
                    <tr key={row.key} className={shared ? 'is-shared' : undefined}>
                      <th scope="row" className="cmp-table__label">{row.label}{shared && <span className="cmp-same">Same</span>}</th>
                      {values.map((value, i) => (
                        <td key={selectedCourses[i].slug} className="cmp-table__cell">
                          <CellValue row={row} value={value} course={selectedCourses[i]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
              <tfoot>
                <tr>
                  <th scope="row" className="cmp-table__label"><span className="sr-only">Next steps</span></th>
                  {selectedCourses.map((course, i) => (
                    <td key={course.slug} className="cmp-table__cell"><ProgrammeActions course={course} index={i} /></td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="cmp-footnote">
            “Areas to explore” is inferred from each programme’s published skills and outcomes. It describes where the skills may be used and is not a placement or employment guarantee.
          </p>

          <div className="cmp-advisor card">
            <div className="min-w-0">
              <p className="eyebrow">Still deciding?</p>
              <h2 className="cmp-title">Get guidance from an academic advisor</h2>
              <p className="cmp-sub">If the published information does not answer your question, the admissions team can explain the programme options and current admission details.</p>
            </div>
            <div className="cmp-advisor__actions">
              <Link href="/contact?source=advisor_request" className="btn btn-secondary" onClick={() => trackConversionEvent('advisor_cta_clicked', { from: 'programme_comparison', programmeSlugs: selected })}>
                <MessageCircle size={15} aria-hidden="true" /> Talk to an advisor
              </Link>
              <Link
                href={`/admissions?source=programme_comparison&programmes=${encodeURIComponent(selected.join(','))}`}
                className="btn btn-primary"
                onClick={() => {
                  trackConversionEvent('comparison_cta_clicked', { action: 'enquiry', programmeSlugs: selected })
                  trackConversionEvent('enquiry_cta_clicked', { from: 'programme_comparison', programmeSlugs: selected })
                }}
              >
                Enquire about these programmes <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ProgrammeHead({ course, index, onRemove, compact }: { course: Course; index: number; onRemove: () => void; compact?: boolean }) {
  const status = STATUS_STYLE[course.admissionStatus]
  return (
    <div className={`cmp-head${compact ? ' is-compact' : ''}`}>
      <div className="cmp-head__top">
        <span className="cmp-badge" data-i={index}>{String.fromCharCode(65 + index)}</span>
        <p className="cmp-head__cat">{course.category}</p>
        <button type="button" className="cmp-icon-btn" onClick={onRemove} aria-label={`Remove ${course.title} from comparison`}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <Link href={`/courses/${course.slug}`} className="cmp-head__title">{course.title}</Link>
      <p className="cmp-head__meta">{[course.duration, course.level].filter(Boolean).join(' · ')}</p>
      <span className="cmp-pill" style={{ background: status.bg, color: status.fg }}>{admissionUi(course.admissionStatus).statusLabel}</span>
    </div>
  )
}

function ProgrammeActions({ course, index }: { course: Course; index: number }) {
  return (
    <div className="cmp-actions">
      <p className="cmp-actions__name"><span className="cmp-badge" data-i={index} aria-hidden="true">{String.fromCharCode(65 + index)}</span><span>{course.title}</span></p>
      <Link href={`/courses/${course.slug}`} className="btn btn-secondary btn-sm" onClick={() => trackConversionEvent('comparison_cta_clicked', { action: 'view_programme', programmeSlug: course.slug })}>
        View programme
      </Link>
      <Link
        href={`/admissions?source=programme_comparison&programmes=${encodeURIComponent(course.slug)}`}
        className="btn btn-primary btn-sm"
        onClick={() => {
          trackConversionEvent('comparison_cta_clicked', { action: 'enquiry', programmeSlugs: [course.slug] })
          trackConversionEvent('enquiry_cta_clicked', { from: 'programme_comparison', programmeSlugs: [course.slug] })
        }}
      >
        Enquire <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}

function CellValue({ row, value, course }: { row: Row; value: Val; course: Course }): ReactNode {
  if (value === null) return <span className="cmp-missing">Not published</span>
  if (row.kind === 'status') {
    const s = STATUS_STYLE[course.admissionStatus]
    return <span className="cmp-pill" style={{ background: s.bg, color: s.fg }}>{value as string}</span>
  }
  if (Array.isArray(value)) {
    return <ul className="cmp-list">{value.map((item) => <li key={item}>{item}</li>)}</ul>
  }
  return <span>{value}</span>
}

function careerDirection(course: Course) {
  const text = [course.title, course.category, course.summary, course.description, ...course.highlights, ...course.tools, ...course.outcomes].join(' ').toLowerCase()
  if (/data|analytics|sql|excel|\bai\b|artificial intelligence/.test(text)) return 'Data, analytics and AI-related technology work'
  if (/cyber|security/.test(text)) return 'Cybersecurity and technology security work'
  if (/network|server|infrastructure/.test(text)) return 'Networking, systems and infrastructure work'
  if (/web|website|html|css|javascript/.test(text)) return 'Web and digital product development'
  if (/business|office|productivity/.test(text)) return 'Business, office and digital productivity work'
  return 'Software and technology development'
}
