'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ChevronLeft, Clock, Compass, RotateCcw, Sparkles } from 'lucide-react'
import { submitPlaygroundActivity } from '../../app/(site)/tech-playground/actions'
import { CAREERS, CAREER_QUIZ_QUESTIONS, PATHFINDER_QUESTIONS, scoreCareers, whyItMatches, type CareerKey } from '../../data/playground'
import { captureAttribution, getAttributionSnapshot } from '../../lib/attribution'
import { trackConversionEvent } from '../../lib/conversion-events'
import { BADGES, type BadgeKey } from '../../data/playground'
import LeadCapture from './LeadCapture'
import ShareButton from './ShareButton'
import { usePlayground } from './usePlayground'

export default function PathwayQuiz({ mode, whatsappHref }: { mode: 'pathfinder' | 'quiz'; whatsappHref?: string }) {
  const questions = mode === 'pathfinder' ? PATHFINDER_QUESTIONS : CAREER_QUIZ_QUESTIONS
  const pg = usePlayground()
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const [activityId, setActivityId] = useState('')
  const [newBadges, setNewBadges] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(false)

  useEffect(() => { captureAttribution(window.location.search) }, [])
  // Move focus to the new question after a step change (not on first paint) so keyboard / screen-reader users follow the flow.
  useEffect(() => {
    if (!started || done) return
    if (!mounted.current) { mounted.current = true; return }
    headingRef.current?.focus({ preventScroll: true })
  }, [index, started, done])
  const q = questions[index]
  const map = useMemo(() => Object.fromEntries(questions.map((qq, i) => [qq.id, answers[i]])), [questions, answers])
  const scored = useMemo(() => (done ? scoreCareers(questions, map) : null), [done, questions, map])

  function start() { setStarted(true); trackConversionEvent('playground_activity_started', { kind: mode }) }
  async function finish(all: number[]) {
    setDone(true)
    const r = await submitPlaygroundActivity({ token: pg.token, kind: mode === 'pathfinder' ? 'career_pathfinder' : 'career_quiz', answers: all, attribution: getAttributionSnapshot() })
    if (r.ok) { setActivityId(r.activityId); setNewBadges(r.newBadges as string[]); pg.refresh() } else setNotice(r.message)
    trackConversionEvent('playground_activity_completed', { kind: mode })
  }
  function choose(i: number) {
    if (picked !== null) return
    setPicked(i)
    window.setTimeout(() => {
      const next = [...answers]; next[index] = i; setAnswers(next); setPicked(null)
      if (index < questions.length - 1) setIndex(index + 1); else void finish(next)
    }, 320)
  }
  function back() { if (index > 0) { setIndex(index - 1) } }
  function reset() { setStarted(false); setIndex(0); setAnswers([]); setDone(false); setActivityId(''); setNewBadges([]); setNotice('') }

  const title = mode === 'pathfinder' ? 'Where Could Tech Take You?' : 'What Tech Career Fits You?'
  if (!started) return (
    <div className="pf pf--intro">
      <div className="pf__glow" aria-hidden="true" />
      <div className="pf__dots" aria-hidden="true" />
      <div className="pf__inner">
        <Link href="/tech-playground" className="pf__back pf__back--link"><ChevronLeft size={15} aria-hidden="true" /> Tech Playground</Link>
        <div className="pf-result__badge mt-5"><Compass size={14} aria-hidden="true" /> {mode === 'pathfinder' ? 'Career Pathfinder' : '1-minute quiz'}</div>
        <h1 className="pf__question pf__question--hero">{title}</h1>
        <p className="mt-3 leading-relaxed max-w-2xl" style={{ color: 'var(--color-body)' }}>{mode === 'pathfinder' ? 'Answer a few honest questions and get a recommended tech career, the skills to build and the APTECH programme that fits.' : 'Six quick picks. No right or wrong answers. See which tech careers match your instincts.'}</p>
        <div className="pf-stats">
          <div className="pf-meta"><p>Questions</p><strong>{questions.length}</strong></div>
          <div className="pf-meta"><p>Time</p><strong>About {mode === 'pathfinder' ? 3 : 1} min</strong></div>
          <div className="pf-meta"><p>Cost</p><strong>Free, no sign-up</strong></div>
        </div>
        <div className="pf__footer">
          <p className="pf__hint"><Sparkles size={14} aria-hidden="true" /> Your recommendation comes first. We only ask for details afterwards.</p>
          <button className="btn btn-accent pg-start" onClick={start}>Start <ArrowRight size={16} aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  )

  if (done && scored) {
    const top = scored.top[0]
    const career = CAREERS[(top?.key ?? 'software') as CareerKey]
    const reasons = whyItMatches(questions, map, career.key)
    return (
      <div className="pf pf--result">
        <div className="pf__glow" aria-hidden="true" />
        <div className="pf__dots" aria-hidden="true" />
        <div className="pf__inner">
        {mode === 'pathfinder' ? (
          <>
            <div className="pf-result__badge"><Check size={14} strokeWidth={3} aria-hidden="true" /> Your recommended path</div>
            <h1 className="pf__question pf__question--hero">{career.title}</h1>
            <p className="mt-3 leading-relaxed max-w-2xl" style={{ color: 'var(--color-body)' }}>{career.summary}</p>
            <div className="pf-stats">
              <div className="pf-meta"><p>Recommended programme</p><strong>{career.programmeLabel}</strong></div>
              <div className="pf-meta pf-meta--wide"><p>Suggested skills</p><ul className="pg-chips">{career.skills.map((s) => <li key={s}>{s}</li>)}</ul></div>
            </div>
            <div className="pg-panel"><h3 className="pg-h3">Why it matches your answers</h3>
              <ul className="pg-list">{(reasons.length ? reasons : ['Your answers pointed consistently towards this path.']).map((r) => <li key={r}>{r}</li>)}</ul></div>
            <div className="pg-panel"><h3 className="pg-h3">Suggested next steps</h3><ol className="pg-list pg-list--num">{career.nextSteps.map((s) => <li key={s}>{s}</li>)}</ol></div>
            {scored.top.length > 1 && (
              <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-line)' }}>
                <p className="eyebrow">Also worth exploring</p>
                <p className="mt-1 font-semibold text-sm" style={{ color: 'var(--color-navy-700)' }}>{scored.top.slice(1).map((t) => CAREERS[t.key].title).join(' · ')}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="pf-result__badge"><Check size={14} strokeWidth={3} aria-hidden="true" /> Your result</div>
            <h1 className="pf__question pf__question--hero">{scored.persona.title}</h1>
            <p className="mt-3 leading-relaxed max-w-2xl" style={{ color: 'var(--color-body)' }}>{scored.persona.text}</p>
            <div className="pg-panel"><h3 className="pg-h3">Best matches</h3>
              <ol className="pg-matches">{scored.top.map((t) => <li key={t.key}><div><strong>{CAREERS[t.key].title}</strong><span>{CAREERS[t.key].summary}</span></div><em>{t.match}%</em></li>)}</ol></div>
          </>
        )}
        {newBadges.length > 0 && <div className="pg-panel pg-panel--gold" role="status"><h3 className="pg-h3">Badge earned!</h3><ul className="pg-badges-inline">{newBadges.map((b) => <li key={b}><span aria-hidden="true">{BADGES[b as BadgeKey]?.emoji}</span> {BADGES[b as BadgeKey]?.title}</li>)}</ul></div>}
        {notice && <p className="pg-error" role="alert">{notice}</p>}
        <div className="pg-actions">
          <Link href="/courses" className="btn btn-accent" onClick={() => trackConversionEvent('playground_cta_clicked', { kind: mode, cta: 'programme', career: career.key })}>{mode === 'pathfinder' ? 'Explore This Programme' : 'Explore Your Recommended Programme'} <ArrowRight size={15} /></Link>
          <Link href={whatsappHref || '/contact'} className="btn btn-secondary" onClick={() => trackConversionEvent('advisor_cta_clicked', { kind: mode })} {...(whatsappHref ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>Talk to an APTECH Advisor</Link>
          <ShareButton text={mode === 'pathfinder' ? 'I just explored my tech career path with APTECH Abeokuta.' : `${scored.persona.title.replace('You’re', 'I’m')} — find your tech career match with APTECH Abeokuta.`} path={mode === 'pathfinder' ? '/tech-playground/career-pathfinder' : '/tech-playground/tech-career-quiz'} label="Share" />
          <button className="btn btn-secondary" onClick={reset}><RotateCcw size={15} /> Retake</button>
        </div>
        {activityId && <LeadCapture token={pg.token} activityId={activityId} />}
        {mode === 'quiz' && <p className="pg-muted">Want a deeper recommendation? <Link className="pg-link" href="/tech-playground/career-pathfinder">Try the Career Pathfinder →</Link></p>}
        </div>
      </div>
    )
  }

  const count = q.options.length
  return (
    <div className="pf">
      <div className="pf__glow" aria-hidden="true" />
      <div className="pf__dots" aria-hidden="true" />
      <div className="pf__inner">
        <div className="pf__meta">
          <p className="pf__step-label"><span>Question</span> {String(index + 1).padStart(2, '0')} <span>of</span> {String(questions.length).padStart(2, '0')}</p>
          <div className="pf__progress" role="progressbar" aria-label="Progress" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={index + 1} aria-valuetext={`Question ${index + 1} of ${questions.length}`}>
            {questions.map((qq, i) => <span key={qq.id} className={i < index ? 'is-done' : i === index ? 'is-current' : ''} />)}
          </div>
        </div>
        <h1 ref={headingRef} tabIndex={-1} key={q.id} className="pf__question">{q.prompt}</h1>
        <p className="pf__sr" aria-live="polite">Question {index + 1} of {questions.length}: {q.prompt}</p>
        <div className={`pf__options${count % 2 === 0 ? ' pf__options--four' : ''}`} role="group" aria-label={q.prompt}>
          {q.options.map((o, i) => {
            const selected = picked === i || (picked === null && answers[index] === i)
            return (
              <button key={o.label} type="button" onClick={() => choose(i)} aria-pressed={selected} className={`pf-option${selected ? ' is-selected' : ''}`}>
                <span className="icon-tile icon-tile--md icon-tile--navy pf-option__glyph" aria-hidden="true">{o.emoji ?? String.fromCharCode(65 + i)}</span>
                <span className="pf-option__copy"><span className="pf-option__title">{o.label}</span></span>
                <span className="pf-option__check" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>
              </button>
            )
          })}
        </div>
        <div className="pf__footer">
          <p className="pf__hint"><Clock size={14} aria-hidden="true" /> No right or wrong answers. Pick what feels closest.</p>
          {index > 0 ? <button type="button" onClick={() => { if (picked === null) back() }} className="pf__back"><ChevronLeft size={15} aria-hidden="true" /> Back</button> : <span className="pf__auto">Select an option to continue <ArrowRight size={14} aria-hidden="true" /></span>}
        </div>
      </div>
    </div>
  )
}
