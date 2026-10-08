'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Clock3, Gauge, ListChecks, Medal, RotateCcw, ShieldCheck, Star, Target, Timer, TrendingUp, Trophy, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { answerPlaygroundQuestion, finishPlaygroundAttempt, startPlaygroundAttempt } from '../../app/(site)/tech-playground/actions'
import { captureChallengeLead } from '../../app/(site)/tech-zone/actions'
import { LeadFormFields, LeadFormStatus } from '../tech-zone/LeadFormFields'
import { captureAttribution, getAttributionSnapshot } from '../../lib/attribution'
import { trackConversionEvent } from '../../lib/conversion-events'
import { BADGES, type BadgeKey } from '../../data/playground'
import DisplayNameForm from './DisplayNameForm'
import RichText from './RichText'
import ShareButton from './ShareButton'
import { usePlayground } from './usePlayground'

type Question = { id: string; question: string; options: string[]; skill_area: string; difficulty: string; points: number; sort_order: number }
export type PlayChallenge = { id: string; name: string; slug: string; description: string; category: string; difficulty: string; estimated_minutes: number; time_limit_seconds?: number | null; playground_kind?: string | null; streak_day?: number | null; scoring_config?: any }
export type Variant = 'weekly' | 'detective' | 'speed_round' | 'data_detective' | 'daily'
type Feedback = { chosen: number; correct: number; isCorrect: boolean; explanation: string | null }

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function shuffle<T>(arr: T[]) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }

export default function PlaygroundQuiz({ challenge, questions, variant, backHref = '/tech-playground', backLabel = 'Tech Playground', eyebrow, extra, onResult, lockedMessage, onBack }: {
  challenge: PlayChallenge; questions: Question[]; variant: Variant; backHref?: string; backLabel?: string; eyebrow?: string
  extra?: React.ReactNode; onResult?: (r: any) => void; lockedMessage?: string | null; onBack?: () => void
}) {
  const pg = usePlayground()
  const limit = challenge.time_limit_seconds ?? null
  const [phase, setPhase] = useState<'intro' | 'play' | 'result'>('intro')
  const [order, setOrder] = useState(questions)
  const [index, setIndex] = useState(0)
  const [attemptId, setAttemptId] = useState('')
  const [startedAt, setStartedAt] = useState(0)
  const [clock, setClock] = useState(0)
  const [fb, setFb] = useState<Feedback | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState<any>(null)
  const [score, setScore] = useState(0)
  const finishing = useRef(false)
  const [, startTransition] = useTransition()

  useEffect(() => { captureAttribution(window.location.search) }, [])
  useEffect(() => {
    if (phase !== 'play') return
    const t = window.setInterval(() => setClock(Date.now()), 250)
    return () => window.clearInterval(t)
  }, [phase])

  const elapsed = phase === 'play' && startedAt ? Math.max(0, Math.floor(((clock || Date.now()) - startedAt) / 1000)) : 0
  const remaining = limit ? Math.max(0, limit - elapsed) : null
  const current = order[index]
  const dataset = challenge.scoring_config?.dataset as { caption?: string; columns: string[]; rows: string[][] } | undefined

  const finish = useCallback(async (id: string) => {
    if (finishing.current) return
    finishing.current = true
    setBusy(true)
    const r = await finishPlaygroundAttempt({ token: pg.token, attemptId: id })
    setBusy(false)
    if (!r.ok) { setNotice(r.message); finishing.current = false; return }
    setResult(r.result); setPhase('result'); setNotice('')
    trackConversionEvent('challenge_result_viewed', { challenge: challenge.slug, kind: variant })
    r.result.newBadges.forEach((b: string) => trackConversionEvent('playground_badge_earned', { badge: b }))
    pg.refresh(); onResult?.(r.result)
  }, [pg, challenge.slug, variant, onResult])

  useEffect(() => { if (phase === 'play' && remaining === 0 && attemptId) void finish(attemptId) }, [phase, remaining, attemptId, finish])

  async function begin() {
    setNotice('')
    if (!pg.token) { setNotice('Getting ready… try again in a second.'); return }
    setBusy(true)
    const r = await startPlaygroundAttempt({ token: pg.token, challengeId: challenge.id, attribution: getAttributionSnapshot() })
    setBusy(false)
    if (!r.ok) { setNotice(r.message); return }
    finishing.current = false
    setOrder(variant === 'speed_round' ? shuffle(questions) : questions)
    setIndex(0); setScore(0); setFb(null); setResult(null); setAttemptId(r.attemptId)
    const now = Date.now(); setStartedAt(now); setClock(now); setPhase('play')
    trackConversionEvent('challenge_started', { challenge: challenge.slug, kind: variant })
  }

  function advance() {
    setFb(null)
    if (index < order.length - 1) setIndex(index + 1)
    else void finish(attemptId)
  }

  async function choose(i: number) {
    if (busy || fb || !current) return
    setBusy(true)
    const r = await answerPlaygroundQuestion({ token: pg.token, attemptId, questionId: current.id, answerIndex: i })
    setBusy(false)
    if (!r.ok) { if ('expired' in r && r.expired) { void finish(attemptId); return } setNotice(r.message); return }
    if (r.isCorrect) setScore((s) => s + r.points)
    setFb({ chosen: r.chosenIndex, correct: r.correctIndex, isCorrect: r.isCorrect, explanation: r.explanation })
    if (variant === 'speed_round') window.setTimeout(() => { setFb(null); if (index < order.length - 1) setIndex((n) => n + 1); else void finish(attemptId) }, 650)
  }

  // ------------------------------------------------------------------ intro
  if (phase === 'intro') return (
    <div className="pg-stage pg-stage--intro pg-intro">
      <div className="pg-intro__glow" aria-hidden="true" />
      {onBack ? <button type="button" className="pg-backbtn pg-backbtn--sm" onClick={onBack}><ArrowLeft size={14} aria-hidden="true" /> {backLabel}</button> : <Link href={backHref} className="pg-backbtn pg-backbtn--sm"><ArrowLeft size={14} aria-hidden="true" /> {backLabel}</Link>}
      {eyebrow && <p className="pg-badge">{eyebrow}</p>}
      <h1 className="pg-title">{challenge.name}</h1>
      <p className="pg-lede">{challenge.description}</p>
      <dl className="pg-stats pg-stats--intro" aria-label="Challenge details">
        <Stat icon={ListChecks} tone="teal" label="Questions" value={questions.length} />
        <Stat icon={Timer} tone="blue" label="Time limit" value={limit ? <>{limit}<small>s</small></> : 'Untimed'} text={!limit} />
        <Stat icon={Gauge} tone="amber" label="Difficulty" value={challenge.difficulty} text />
      </dl>
      {extra}
      {lockedMessage ? <p className="pg-note" role="status">{lockedMessage}</p> : (
        <>
          {notice && <p className="pg-error pg-error--inv" role="alert">{notice}</p>}
          <button className="btn btn-accent pg-start pg-start--wide" onClick={begin} disabled={busy || !pg.ready}>{busy ? 'Starting…' : variant === 'speed_round' ? 'Start the clock' : 'Start Challenge'} <ArrowRight size={16} /></button>
          <p className="pg-fine"><ShieldCheck size={14} aria-hidden="true" /> No account needed. Answers are checked instantly.</p>
        </>
      )}
    </div>
  )

  // ------------------------------------------------------------------ play
  if (phase === 'play' && current) {
    const low = remaining !== null && remaining <= 10
    return (
      <div className="pg-stage pg-stage--play">
        {dataset && <DataTable dataset={dataset} />}
        <div className="pg-bar">
          <p className="pg-bar__count">Question {index + 1} <span>of {order.length}</span></p>
          <p className="pg-score" aria-live="polite">{score} pts</p>
          <p className={`pg-timer${low ? ' is-low' : ''}`} role="timer" aria-label={remaining !== null ? `${remaining} seconds left` : `${elapsed} seconds elapsed`}><Clock3 size={15} /> {remaining !== null ? fmt(remaining) : fmt(elapsed)}</p>
        </div>
        <div className="pg-steps" aria-hidden="true">{order.map((q2, i) => <span key={q2.id} className={i < index || (i === index && fb) ? 'is-done' : i === index ? 'is-current' : ''} />)}</div>
        {limit && <div className="pg-progress pg-progress--time" aria-hidden="true"><span style={{ width: `${((remaining ?? 0) / limit) * 100}%` }} /></div>}
        <div key={current.id} className="pg-qcard">
          <div className="pg-qtags"><span className="pg-qtag">{current.skill_area}</span><span className="pg-qtag pg-qtag--pts"><Star size={11} aria-hidden="true" /> {current.points} pts</span></div>
          <div className="pg-qtext"><RichText text={current.question} /></div>
        </div>
        <div className="pg-answers" role="group" aria-label="Answer choices">
          {current.options.map((o, i) => {
            const state = fb ? (i === fb.correct ? 'is-correct' : i === fb.chosen ? 'is-wrong' : 'is-dim') : ''
            return (
              <button key={i} className={`pg-answer ${state}`} onClick={() => choose(i)} disabled={busy || !!fb}>
                <span className="pg-answer__key">{String.fromCharCode(65 + i)}</span>
                <span className="pg-answer__text">{o}</span>
                {fb && i === fb.correct && <Check size={18} aria-label="Correct" />}
                {fb && i === fb.chosen && i !== fb.correct && <X size={18} aria-label="Incorrect" />}
              </button>
            )
          })}
        </div>
        {fb && variant !== 'speed_round' && (
          <div className={`pg-feedback ${fb.isCorrect ? 'is-correct' : 'is-wrong'}`} role="status">
            <span className="pg-feedback__icon" aria-hidden="true">{fb.isCorrect ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}</span>
            <div className="pg-feedback__body"><strong>{fb.isCorrect ? 'Correct!' : 'Not quite.'}</strong> {fb.explanation}</div>
            <button className="btn btn-accent pg-feedback__next" onClick={advance} autoFocus>{index < order.length - 1 ? 'Next' : 'See my result'} <ArrowRight size={15} /></button>
          </div>
        )}
        {notice && <p className="pg-error" role="alert">{notice}</p>}
        {busy && !fb && phase === 'play' && finishing.current && <p className="pg-muted">Saving your result…</p>}
      </div>
    )
  }

  // ------------------------------------------------------------------ result
  if (phase === 'result' && result) return <Result r={result} challenge={challenge} variant={variant} token={pg.token} displayName={pg.displayName} onNamed={() => pg.refresh()} onAgain={() => { setPhase('intro'); setResult(null) }} backHref={backHref} onBack={onBack} />
  return <div className="pg-stage"><p className="pg-muted">Loading…</p></div>
}

function DataTable({ dataset }: { dataset: { caption?: string; columns: string[]; rows: string[][] } }) {
  return (
    <div className="pg-table-wrap" tabIndex={0} role="region" aria-label={dataset.caption || 'Dataset'}>
      <table className="pg-table">
        {dataset.caption && <caption>{dataset.caption}</caption>}
        <thead><tr>{dataset.columns.map((c, i) => <th key={c} scope="col" className={i ? 'num' : ''}>{c}</th>)}</tr></thead>
        <tbody>{dataset.rows.map((r, ri) => <tr key={ri}>{r.map((c, i) => i === 0 ? <th scope="row" key={i}>{c}</th> : <td key={i} className="num">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

function Result({ r, challenge, variant, token, displayName, onNamed, onAgain, backHref, onBack }: { r: any; challenge: PlayChallenge; variant: Variant; token: string; displayName: string | null; onNamed: () => void; onAgain: () => void; backHref: string; onBack?: () => void }) {
  const [named, setNamed] = useState<string | null>(displayName)
  const [extraBadges, setExtraBadges] = useState<string[]>([])
  const badges: string[] = useMemo(() => [...r.newBadges, ...extraBadges], [r.newBadges, extraBadges])
  const pct = Math.round(r.percentage)
  let headline = 'Challenge complete'
  let sub = r.message as string
  if (variant === 'detective') { headline = pct >= 50 ? 'Case Solved!' : 'Case Still Open'; sub = pct >= 50 ? `You found the problem in ${r.completionTimeSeconds} seconds.` : `You uncovered ${r.correctAnswers} of ${r.totalQuestions} clues. Review the explanations and try again.` }
  if (variant === 'speed_round') { headline = `Your Tech IQ Score: ${r.techIq}/100`; sub = `${r.correctAnswers} correct in ${r.completionTimeSeconds} seconds.` }
  if (variant === 'data_detective') { headline = pct >= 60 ? 'You think like a Data Analyst!' : 'You’re building analyst instincts'; sub = pct >= 60 ? 'You read the numbers, spotted the trend and drew the right conclusion.' : 'Analysts practise reading tables daily. A few more rounds will sharpen this.' }
  if (variant === 'daily') { headline = `Day ${r.streak?.day ?? ''} complete`; sub = r.streak?.finished ? 'You finished the full 7-day streak!' : 'You’re on a roll. Come back tomorrow for the next challenge.' }
  const cta = variant === 'data_detective' ? { href: '/courses', label: 'Explore Data & Analytics Programmes' } : variant === 'detective' ? { href: '/courses', label: 'Want to learn how to do more? Explore APTECH Programmes' } : variant === 'speed_round' ? { href: '/courses', label: 'See Your Recommended Learning Path' } : { href: '/courses', label: 'Explore APTECH Programmes' }
  const showCompete = variant !== 'daily'

  return (
    <div className="pg-stage pg-stage--result">
      <p className="pg-eyebrow">{challenge.name}</p>
      <h1 className="pg-title">{headline}</h1>
      <p className="pg-lede">{sub}</p>
      <div className="pg-summary">
        <div className="pg-ring" style={{ ['--pct' as any]: `${pct}%` }} role="img" aria-label={`Score ${pct} percent`}><strong>{pct}%</strong><span>Your Score</span></div>
        <dl className="pg-stats">
          <Stat icon={Check} tone="teal" label="Correct" value={<>{r.correctAnswers}<small>/{r.totalQuestions}</small></>} />
          <Stat icon={Star} tone="amber" label="Points" value={r.score} />
          <Stat icon={Clock3} tone="blue" label="Time" value={<>{r.completionTimeSeconds}<small>s</small></>} />
          <Stat icon={Medal} tone="violet" label="Level" value={r.resultLevel} text />
          {showCompete && r.percentile !== null && <Stat icon={TrendingUp} tone="teal" label="Percentile" value={<>Top {Math.max(1, 100 - r.percentile)}<small>%</small></>} />}
          {showCompete && r.rankWeek && <Stat icon={Target} tone="amber" label="Weekly rank" value={`#${r.rankWeek}`} />}
        </dl>
      </div>

      {variant === 'speed_round' && r.skills?.length > 0 && (
        <div className="pg-panel"><h3 className="pg-h3">Category performance</h3>
          <ul className="pg-skills">{r.skills.filter((s: any) => s.answered > 0).map((s: any) => <li key={s.skill}><span>{s.skill}</span><div className="pg-skillbar"><i style={{ width: `${(s.correct / s.answered) * 100}%` }} /></div><em>{s.correct}/{s.answered}</em></li>)}</ul>
        </div>
      )}

      {badges.length > 0 && (
        <div className="pg-panel pg-panel--gold" role="status"><h3 className="pg-h3">New badge{badges.length > 1 ? 's' : ''} earned!</h3>
          <ul className="pg-badges-inline">{badges.map((b) => <li key={b}><span aria-hidden="true">{BADGES[b as BadgeKey]?.emoji}</span> {BADGES[b as BadgeKey]?.title}</li>)}</ul>
          <Link className="pg-link" href="/tech-playground/badges">View all my badges</Link>
        </div>
      )}

      {r.streak?.finished && <Certificate />}

      {showCompete && (r.needsDisplayName && !named ? (
        <div className="pg-panel"><h3 className="pg-h3">Can you make the Top 10?</h3><p className="pg-muted">Pick a display name to put this score on the Tech Arena leaderboard.</p>
          <DisplayNameForm token={token} onSaved={(n, nb) => { setNamed(n); setExtraBadges(nb); onNamed() }} /></div>
      ) : <p className="pg-muted">Playing as <strong>{named}</strong>. <Link href="/tech-playground/leaderboard" className="pg-link">See the Tech Arena →</Link></p>)}

      {r.recommendations?.length > 0 && <div className="pg-panel"><h3 className="pg-h3">Programmes that build these skills</h3><ul className="pg-reclist">{r.recommendations.map((p: any) => <li key={p.id}>{p.name}</li>)}</ul></div>}

      <div className="pg-actions">
        <Link href={cta.href} className="btn btn-accent" onClick={() => trackConversionEvent('playground_cta_clicked', { challenge: challenge.slug, cta: 'programmes' })}>{cta.label} <ArrowRight size={15} /></Link>
        {variant !== 'daily' && <button className="btn btn-secondary" onClick={onAgain}><RotateCcw size={15} /> Challenge Again</button>}
        <ShareButton text={variant === 'speed_round' ? `I scored ${r.techIq}/100 on the APTECH 60-Second Tech IQ. Can you beat it?` : `I scored ${pct}% on “${challenge.name}” at APTECH Tech Playground. Can you beat it?`} />
        {showCompete && <Link href="/tech-playground/leaderboard" className="btn btn-secondary"><Trophy size={15} /> Leaderboard</Link>}
      </div>
      <AttemptLead attemptId={r.attemptId} />
      {onBack ? <button type="button" className="pg-backbtn" onClick={onBack}><ArrowLeft size={15} aria-hidden="true" /> Back</button> : <Link href={backHref} className="pg-backbtn"><ArrowLeft size={15} aria-hidden="true" /> Back</Link>}
    </div>
  )
}

function Stat({ icon: Icon, tone, label, value, text = false }: { icon: LucideIcon; tone: 'teal' | 'amber' | 'blue' | 'violet'; label: string; value: React.ReactNode; text?: boolean }) {
  return (
    <div className={`pg-stat pg-stat--${tone}`}>
      <span className="pg-stat__icon" aria-hidden="true"><Icon size={16} strokeWidth={2.2} /></span>
      <dt>{label}</dt>
      <dd className={text ? 'is-text' : ''}>{value}</dd>
    </div>
  )
}

function Certificate() {
  return (
    <div className="pg-cert" role="img" aria-label="7-Day Tech Explorer certificate">
      <p className="pg-eyebrow">APTECH Abeokuta Tech Playground</p>
      <h2>🏆 7-Day Tech Explorer</h2>
      <p>Completed all seven daily tech challenges.</p>
    </div>
  )
}

function AttemptLead({ attemptId }: { attemptId: string }) {
  const [open, setOpen] = useState(false); const [done, setDone] = useState(false); const [msg, setMsg] = useState(''); const [pending, start] = useTransition()
  if (done) return <div className="pg-panel pg-panel--ok" role="status"><strong>Thank you!</strong><p>We&apos;ll be in touch about your result and suitable programmes.</p></div>
  if (!open) return <div className="pg-panel"><h3 className="pg-h3">Save your result & get guidance</h3><p className="pg-muted">Optional. An APTECH advisor can suggest next steps based on your result.</p><button className="btn btn-primary mt-3" onClick={() => setOpen(true)}>Save my result</button></div>
  return (
    <form className="pg-panel lead-form" action={(fd: FormData) => start(async () => { setMsg(''); const r = await captureChallengeLead(fd); if (!r.ok) { setMsg(r.message ?? 'Could not save.'); return } trackConversionEvent('playground_lead_captured', { attemptId }); setDone(true) })}>
      <input type="hidden" name="attemptId" value={attemptId} />
      <input type="hidden" name="attribution" value={JSON.stringify(getAttributionSnapshot() || {})} />
      <LeadFormFields showPreference />
      <LeadFormStatus message={msg} tone="error" />
      <div className="lead-form__actions"><button className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Send my result'}</button></div>
    </form>
  )
}
