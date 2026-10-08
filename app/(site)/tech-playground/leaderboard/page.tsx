import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { buildMetadata } from '../../../../lib/seo'
import { getLeaderboard, PERIODS, type Period } from '../../../../lib/playground'
import PageShell from '../../../../components/tech-playground/PageShell'

const path = '/tech-playground/leaderboard'
const description = 'The APTECH Tech Arena: see who is leading the Tech Playground challenges today, this week, this month and all time.'
export const metadata = buildMetadata({ title: 'APTECH Tech Arena Leaderboard | Tech Playground', description, path })
export const revalidate = 30

const medals = ['🥇', '🥈', '🥉']

export default async function Page({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const sp = await searchParams
  const period = (PERIODS.some((p) => p.key === sp.period) ? sp.period : 'week') as Period
  const rows = await getLeaderboard(period, 25)
  return (
    <PageShell path={path} name="APTECH Tech Arena" description={description}>
      <div className="pg-stage pg-stage--light">
        <Link href="/tech-playground" className="pg-back">← Tech Playground</Link>
        <p className="pg-eyebrow"><Trophy size={14} className="inline" /> Leaderboard</p>
        <h1 className="pg-title">APTECH TECH ARENA</h1>
        <p className="pg-lede">Best score per player, ranked by score then speed. Only chosen display names are shown. No emails or phone numbers, ever.</p>
        <nav className="pg-tabs" aria-label="Leaderboard period">
          {PERIODS.map((p) => <Link key={p.key} href={`/tech-playground/leaderboard?period=${p.key}`} className={`pg-tab${p.key === period ? ' is-active' : ''}`} aria-current={p.key === period ? 'page' : undefined} scroll={false}>{p.label}</Link>)}
        </nav>
        {rows.length === 0 ? (
          <div className="pg-panel"><h2 className="pg-h3">No scores yet for this period</h2><p className="pg-muted">Be the first to claim the top spot.</p></div>
        ) : (
          <div className="pg-lb" role="table" aria-label={`Leaderboard: ${PERIODS.find((p) => p.key === period)?.label}`}>
            <div className="pg-lb__head" role="row"><span role="columnheader">Rank</span><span role="columnheader">Display name</span><span role="columnheader">Score</span><span role="columnheader" className="pg-hide-sm">Challenge</span><span role="columnheader">Time</span></div>
            {rows.map((r) => (
              <div key={r.rank} className={`pg-lb__row${r.rank <= 3 ? ' is-top' : ''}`} role="row">
                <span role="cell" className="pg-lb__rank">{medals[r.rank - 1] ?? `#${r.rank}`}</span>
                <span role="cell" className="pg-lb__name">{r.displayName}<small className="pg-show-sm">{r.challenge}</small></span>
                <span role="cell" className="pg-lb__score">{Math.round(r.percentage)}%</span>
                <span role="cell" className="pg-hide-sm pg-lb__chal">{r.challenge}</span>
                <span role="cell" className="pg-lb__time">{r.timeSeconds}s</span>
              </div>
            ))}
          </div>
        )}
        <div className="pg-arena">
          <div><h2 className="pg-h2">Can You Make the Top 10?</h2><p className="pg-muted">Play any challenge, pick a display name and your best score goes on the board.</p></div>
          <div className="pg-actions"><Link href="/tech-playground/weekly-challenge" className="btn btn-accent">Take the Challenge</Link><Link href="/tech-playground/tech-iq" className="btn btn-secondary">60-Second Tech IQ</Link></div>
        </div>
      </div>
    </PageShell>
  )
}
