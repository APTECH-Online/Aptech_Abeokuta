'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Lock } from 'lucide-react'
import PlaygroundQuiz from './PlaygroundQuiz'
import ShareButton from './ShareButton'
import { usePlayground } from './usePlayground'
import { STREAK_DAY_TITLES } from '../../data/playground'

type Day = { day: number; challenge: any; questions: any[] }

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
    <div className="pg-stage pg-stage--light">
      <Link href="/tech-playground" className="pg-back">← Tech Playground</Link>
      <p className="pg-eyebrow">🔥 Your Tech Streak</p>
      <h1 className="pg-title">{finished ? '7 of 7 complete' : `Day ${Math.max(1, Math.min(7, nextDay ?? current))} of 7`}</h1>
      <p className="pg-lede" aria-live="polite">{pg.ready ? message : 'Loading your progress…'}</p>
      <ol className="pg-days">
        {days.map((d) => {
          const isDone = done.includes(d.day)
          const isNext = d.day === nextDay
          return (
            <li key={d.day} className={`pg-day${isDone ? ' is-done' : ''}${isNext ? ' is-next' : ''}`}>
              <span className="pg-day__n">{isDone ? <Check size={16} aria-label="Completed" /> : d.day > (nextDay ?? 8) ? <Lock size={14} aria-label="Locked" /> : d.day}</span>
              <div><strong>Day {d.day}</strong><span>{STREAK_DAY_TITLES[d.day - 1]}</span></div>
              {isNext && <button className="btn btn-accent" onClick={() => setPlaying(d.day)} disabled={!canToday}>{canToday ? 'Play' : 'Tomorrow'}</button>}
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
  )
}
