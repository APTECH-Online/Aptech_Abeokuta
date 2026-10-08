'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart3, Check, ChevronLeft, Code2, Database, Flag, Flame, Globe, Laptop, Lock, Play, ShieldCheck } from 'lucide-react'
import PlaygroundQuiz from './PlaygroundQuiz'
import ShareButton from './ShareButton'
import { usePlayground } from './usePlayground'
import { STREAK_DAY_TITLES } from '../../data/playground'

type Day = { day: number; challenge: any; questions: any[] }
const DAY_ICONS = [Laptop, Code2, BarChart3, Globe, Database, ShieldCheck, Flag]

export default function StreakBoard({ days }: { days: Day[] }) {
  const pg = usePlayground()
  const [playing, setPlaying] = useState<number | null>(null)
  const done = pg.streak?.completedDays ?? []
  const nextDay = pg.streak?.nextDay ?? null
  const finished = !!pg.streak?.finished
  const canToday = pg.streak?.canPlayToday ?? true
  const current = done.length
  const active = playing ? days.find((d) => d.day === playing) : null

  if (active) return (
    <PlaygroundQuiz key={active.day} challenge={active.challenge} questions={active.questions} variant="daily" backHref="/tech-playground/7-day-challenge" backLabel="7-Day Tech Streak" eyebrow={`Day ${active.day} of 7`} onResult={() => { void pg.refresh() }} onBack={() => { setPlaying(null); void pg.refresh() }} />
  )

  const message = finished ? 'You did it. All seven days complete!' : done.length === 0 ? 'Day 1 is waiting. Start your streak today.' : canToday ? "You're on a roll. Keep going!" : 'Great work today. Your next challenge unlocks tomorrow.'

  return (
    <div className="pf sk">
      <div className="pf__glow" aria-hidden="true" />
      <div className="pf__dots" aria-hidden="true" />
      <div className="pf__inner">
        <Link href="/tech-playground" className="pgx-back"><ChevronLeft size={15} aria-hidden="true" /> Tech Playground</Link>
        <p className="pgx-badge"><Flame size={13} aria-hidden="true" /> Your Tech Streak</p>
        <h1 className="pf__question pf__question--hero">{finished ? '7 of 7 complete' : `Day ${Math.max(1, Math.min(7, nextDay ?? current))} of 7`}</h1>
        <p className="mt-3 leading-relaxed max-w-2xl" style={{ color: 'var(--color-body)' }} aria-live="polite">{pg.ready ? message : 'Loading your progress…'}</p>
        <div className="sk__meter">
          <div className="pf__progress" role="progressbar" aria-label="Streak progress" aria-valuemin={0} aria-valuemax={7} aria-valuenow={done.length}>
            {days.map((d) => <span key={d.day} className={done.includes(d.day) ? 'is-done' : d.day === nextDay ? 'is-current' : ''} />)}
          </div>
          <p className="sk__meter-label"><b>{done.length}</b>/7 complete</p>
        </div>
        <ol className="sk-days">
          {days.map((d) => {
            const isDone = done.includes(d.day)
            const isNext = d.day === nextDay
            const locked = !isDone && d.day > (nextDay ?? 8)
            const Icon = DAY_ICONS[d.day - 1] ?? Flag
            return (
              <li key={d.day} className={`sk-day${isDone ? ' is-done' : ''}${isNext ? ' is-next' : ''}${locked ? ' is-locked' : ''}`}>
                <span className="sk-day__n" aria-hidden="true">{isDone ? <Check size={18} strokeWidth={3} /> : locked ? <Lock size={15} /> : <Icon size={18} />}</span>
                <div className="sk-day__body"><strong>Day {d.day}</strong><span>{STREAK_DAY_TITLES[d.day - 1]}</span></div>
                {isDone && <span className="sk-day__pill sk-day__pill--done">Done</span>}
                {locked && <span className="sk-day__pill">Locked</span>}
                {isNext && <button className="btn btn-accent sk-day__play" onClick={() => setPlaying(d.day)} disabled={!canToday}>{canToday ? <><Play size={14} aria-hidden="true" /> Play</> : 'Tomorrow'}</button>}
                <span className="sr-only">{isDone ? 'Completed' : locked ? 'Locked' : ''}</span>
              </li>
            )
          })}
        </ol>
        {finished && (
          <div className="pg-cert" role="img" aria-label="7-Day Tech Explorer badge">
            <p className="pg-eyebrow">APTECH Abeokuta Tech Playground</p>
            <h2>🏆 7-Day Tech Explorer</h2>
            <p>Seven days. Seven challenges. Completed.</p>
            <div className="pg-actions"><ShareButton text="I completed the 7-Day Tech Streak at APTECH Abeokuta and earned the Tech Explorer badge!" path="/tech-playground/7-day-challenge" /><Link href="/courses" className="btn btn-accent">Start Learning</Link></div>
          </div>
        )}
        <p className="pg-muted">One challenge per day. Your progress is saved to this browser, with no account needed.</p>
      </div>
    </div>
  )
}
