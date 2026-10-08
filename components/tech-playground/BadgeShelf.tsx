'use client'

import Link from 'next/link'
import { BADGES, type BadgeKey } from '../../data/playground'
import DisplayNameForm from './DisplayNameForm'
import { usePlayground } from './usePlayground'

export default function BadgeShelf() {
  const pg = usePlayground()
  const earned = new Map(pg.badges.map((b) => [b.key, b.awardedAt]))
  return (
    <div className="pg-shelf">
      {pg.ready && <p className="pg-muted">{earned.size} of {Object.keys(BADGES).length} badges earned on this device{pg.displayName ? <> · playing as <strong>{pg.displayName}</strong></> : null}.</p>}
      <ul className="pg-badgegrid">
        {(Object.keys(BADGES) as BadgeKey[]).map((k) => {
          const on = earned.has(k)
          return (
            <li key={k} className={`pg-badge${on ? ' is-on' : ''}`}>
              <span className="pg-badge__icon" aria-hidden="true">{BADGES[k].emoji}</span>
              <strong>{BADGES[k].title}</strong>
              <span>{on ? `Earned ${new Date(earned.get(k) as string).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}` : BADGES[k].how}</span>
              <span className="sr-only">{on ? 'Earned' : 'Locked'}</span>
            </li>
          )
        })}
      </ul>
      {pg.ready && !pg.displayName && <div className="pg-panel"><h3 className="pg-h3">Want to appear on the leaderboard?</h3><DisplayNameForm token={pg.token} onSaved={() => pg.refresh()} /></div>}
      <p className="pg-muted">Badges are linked to this browser, not an account. Clearing site data or switching devices will start fresh. <Link className="pg-link" href="/tech-playground">Earn more →</Link></p>
    </div>
  )
}
