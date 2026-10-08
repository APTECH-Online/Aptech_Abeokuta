'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react'
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

  useEffect(() => { captureAttribution(window.location.search) }, [])
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
    <div className="pg-stage pg-stage--intro">
      <Link href="/tech-playground" className="pg-back">← Tech Playground</Link>
      <p className="pg-eyebrow">{mode === 'pathfinder' ? 'Career Pathfinder' : '1-minute quiz'}</p>
      <h1 className="pg-title">{title}</h1>
      <p className="pg-lede">{mode === 'pathfinder' ? 'Answer a few honest questions and get a recommended tech career, the skills to build and the APTECH programme that fits.' : 'Six quick picks. No right or wrong answers. See which tech careers match your instincts.'}</p>
      <ul className="pg-meta"><li><strong>{questions.length}</strong> questions</li><li>About <strong>{mode === 'pathfinder' ? 3 : 1}</strong> min</li><li>Free, no sign-up</li></ul>
      <button className="btn btn-accent pg-start" onClick={start}>Start <ArrowRight size={16} /></button>
    </div>
  )

  if (done && scored) {
    const top = scored.top[0]
    const career = CAREERS[(top?.key ?? 'software') as CareerKey]
    const reasons = whyItMatches(questions, map, career.key)
    return (
      <div className="pg-stage pg-stage--result">
        {mode === 'pathfinder' ? (
          <>
            <p className="pg-eyebrow">Your Recommended Path</p>
            <h1 className="pg-title">{career.title}</h1>
            <p className="pg-lede">{career.summary}</p>
            <div className="pg-panel"><h3 className="pg-h3">Why it matches your answers</h3>
              <ul className="pg-list">{(reasons.length ? reasons : ['Your answers pointed consistently towards this path.']).map((r) => <li key={r}>{r}</li>)}</ul></div>
            <div className="pg-grid2">
              <div className="pg-panel"><h3 className="pg-h3">Suggested skills</h3><ul className="pg-chips">{career.skills.map((s) => <li key={s}>{s}</li>)}</ul></div>
              <div className="pg-panel"><h3 className="pg-h3">Recommended APTECH programme</h3><p><strong>{career.programmeLabel}</strong></p></div>
            </div>
            <div className="pg-panel"><h3 className="pg-h3">Suggested next steps</h3><ol className="pg-list pg-list--num">{career.nextSteps.map((s) => <li key={s}>{s}</li>)}</ol></div>
            {scored.top.length > 1 && <p className="pg-muted">Also worth exploring: {scored.top.slice(1).map((t) => CAREERS[t.key].title).join(' · ')}</p>}
          </>
        ) : (
          <>
            <p className="pg-eyebrow">Your result</p>
            <h1 className="pg-title">{scored.persona.title}</h1>
            <p className="pg-lede">{scored.persona.text}</p>
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
    )
  }

  return (
    <div className="pg-stage pg-stage--play pg-stage--light">
      <div className="pg-bar"><p className="pg-bar__count">Question {index + 1} <span>of {questions.length}</span></p>
        {index > 0 && <button className="pg-link" onClick={back}><ArrowLeft size={14} /> Back</button>}</div>
      <div className="pg-progress" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index}><span style={{ width: `${(index / questions.length) * 100}%` }} /></div>
      <div key={q.id} className="pg-qcard pg-qcard--light"><h1 className="pg-qprompt">{q.prompt}</h1></div>
      <div className={`pg-pick ${q.options.length === 4 ? 'pg-pick--4' : ''}`} role="group" aria-label="Choose one">
        {q.options.map((o, i) => (
          <button key={o.label} className={`pg-card-answer${picked === i ? ' is-picked' : ''}${answers[index] === i && picked === null ? ' was-picked' : ''}`} onClick={() => choose(i)} aria-pressed={picked === i}>
            {o.emoji && <span className="pg-card-answer__emoji" aria-hidden="true">{o.emoji}</span>}
            <span>{o.label}</span>{picked === i && <Check size={18} />}
          </button>
        ))}
      </div>
    </div>
  )
}
