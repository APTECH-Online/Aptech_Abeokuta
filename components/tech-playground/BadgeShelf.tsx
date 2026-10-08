'use client'

import Link from 'next/link'
import { ArrowRight, Lock } from 'lucide-react'
import { BADGES, type BadgeKey } from '../../data/playground'
import DisplayNameForm from './DisplayNameForm'
import { usePlayground } from './usePlayground'

export default function BadgeShelf() {
  const pg = usePlayground()
  const earned = new Map(pg.badges.map((b) => [b.key, b.awardedAt]))
  const keys = Object.keys(BADGES) as BadgeKey[]
  const pct = Math.round((earned.size / keys.length) * 100)
  return (
    <div className="bd__shelf">
      {pg.ready && (
        <div className="bd-progress">
          <div className="bd-progress__text">
            <p><b>{earned.size}</b> of {keys.length} badges earned</p>
            <span>on this device{pg.displayName ? <> · playing as <strong>{pg.displayName}</strong></> : null}</span>
          </div>
          <div className="bd-progress__bar" role="progressbar" aria-label="Badges earned" aria-valuemin={0} aria-valuemax={keys.length} aria-valuenow={earned.size}><span style={{ width: `${pct}%` }} /></div>
        </div>
      )}
      <ul className="bd-grid">
        {keys.map((k) => {
          const on = earned.has(k)
          return (
            <li key={k} className={`bd-card${on ? ' is-on' : ''}`}>
              <span className="bd-card__icon" aria-hidden="true">{BADGES[k].emoji}{!on && <i><Lock size={11} /></i>}</span>
              <strong>{BADGES[k].title}</strong>
              <span className="bd-card__how">{on ? `Earned ${new Date(earned.get(k) as string).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}` : BADGES[k].how}</span>
              <span className="sr-only">{on ? 'Earned' : 'Locked'}</span>
            </li>
          )
        })}
      </ul>
      {pg.ready && !pg.displayName && <div className="pg-panel"><h3 className="pg-h3">Want to appear on the leaderboard?</h3><DisplayNameForm token={pg.token} onSaved={() => pg.refresh()} /></div>}
      <p className="pg-muted">Badges are linked to this browser, not an account. Clearing site data or switching devices will start fresh. <Link className="pg-link" href="/tech-playground">Earn more <ArrowRight size={12} className="inline" aria-hidden="true" /></Link></p>
    </div>
  )
}
