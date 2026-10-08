import Link from 'next/link'
import { ArrowRight, ChevronLeft, Crown, Timer, Trophy, Users, Zap } from 'lucide-react'
import { buildMetadata } from '../../../../lib/seo'
import { getLeaderboard, PERIODS, type Period } from '../../../../lib/playground'
import PageShell from '../../../../components/tech-playground/PageShell'

const path = '/tech-playground/leaderboard'
const description = 'The APTECH Tech Arena: see who is leading the Tech Playground challenges today, this week, this month and all time.'
export const metadata = buildMetadata({ title: 'APTECH Tech Arena Leaderboard | Tech Playground', description, path })
export const revalidate = 30

const medals = ['🥇', '🥈', '🥉']
const initials = (name: string) => (name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('') || '?').toUpperCase()

export default async function Page({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const sp = await searchParams
  const period = (PERIODS.some((p) => p.key === sp.period) ? sp.period : 'week') as Period
  const periodLabel = PERIODS.find((p) => p.key === period)?.label
  const rows = await getLeaderboard(period, 25)
  const podium = rows.slice(0, 3)
  const rest = rows.slice(3)
  const topScore = rows.length ? Math.round(Math.max(...rows.map((r) => r.percentage))) : null
  const fastest = rows.length ? Math.min(...rows.map((r) => r.timeSeconds)) : null

  return (
    <PageShell path={path} name="APTECH Tech Arena" description={description}>
      <div className="pg-stage pg-stage--light lb">
        <div className="lb__glow" aria-hidden="true" />
        <Link href="/tech-playground" className="lb__back"><ChevronLeft size={15} aria-hidden="true" /> Tech Playground</Link>
        <p className="lb__badge"><Trophy size={13} aria-hidden="true" /> Leaderboard</p>
        <h1 className="pg-title">APTECH TECH ARENA</h1>
        <p className="pg-lede">Best score per player, ranked by score then speed. Only chosen display names are shown. No emails or phone numbers, ever.</p>

        <nav className="lb__tabs" aria-label="Leaderboard period">
          {PERIODS.map((p) => <Link key={p.key} href={`/tech-playground/leaderboard?period=${p.key}`} className={`lb__tab${p.key === period ? ' is-active' : ''}`} aria-current={p.key === period ? 'page' : undefined} scroll={false}>{p.label}</Link>)}
        </nav>

        {rows.length === 0 ? (
          <div className="lb__empty">
            <span className="lb__empty-icon" aria-hidden="true"><Crown size={26} /></span>
            <h2 className="pg-h3">No scores yet for {periodLabel?.toLowerCase() ?? 'this period'}</h2>
            <p className="pg-muted">Be the first to claim the top spot.</p>
            <Link href="/tech-playground/weekly-challenge" className="btn btn-accent mt-4">Take the Challenge <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
        ) : (
          <>
            <dl className="lb__kpis">
              <div className="lb-kpi"><span className="lb-kpi__icon lb-kpi__icon--navy" aria-hidden="true"><Users size={16} /></span><dt>Players ranked</dt><dd>{rows.length}</dd></div>
              <div className="lb-kpi"><span className="lb-kpi__icon lb-kpi__icon--amber" aria-hidden="true"><Zap size={16} /></span><dt>Top score</dt><dd>{topScore}<small>%</small></dd></div>
              <div className="lb-kpi"><span className="lb-kpi__icon lb-kpi__icon--teal" aria-hidden="true"><Timer size={16} /></span><dt>Fastest time</dt><dd>{fastest}<small>s</small></dd></div>
            </dl>

            <ol className="lb-podium" aria-label={`Top ${podium.length}: ${periodLabel}`}>
              {podium.map((r) => (
                <li key={r.rank} className={`lb-pod lb-pod--${r.rank}`}>
                  {r.rank === 1 && <Crown className="lb-pod__crown" size={20} aria-hidden="true" />}
                  <span className="lb-pod__medal" aria-hidden="true">{medals[r.rank - 1]}</span>
                  <span className="lb-avatar lb-avatar--lg" aria-hidden="true">{initials(r.displayName)}</span>
                  <p className="lb-pod__rank">Rank {r.rank}</p>
                  <h2 className="lb-pod__name">{r.displayName}</h2>
                  <p className="lb-pod__score">{Math.round(r.percentage)}<small>%</small></p>
                  <p className="lb-pod__meta"><Timer size={12} aria-hidden="true" /> {r.timeSeconds}s</p>
                  <p className="lb-pod__chal">{r.challenge}</p>
                </li>
              ))}
            </ol>

            {rest.length > 0 && (
              <div className="lb-list" role="table" aria-label={`Ranks ${rest[0].rank} to ${rest[rest.length - 1].rank}: ${periodLabel}`}>
                <div className="lb-list__head" role="row"><span role="columnheader">Rank</span><span role="columnheader">Player</span><span role="columnheader">Score</span><span role="columnheader">Time</span></div>
                {rest.map((r) => (
                  <div key={r.rank} className="lb-row" role="row">
                    <span role="cell" className="lb-row__rank">#{r.rank}</span>
                    <span role="cell" className="lb-row__player">
                      <span className="lb-avatar" aria-hidden="true">{initials(r.displayName)}</span>
                      <span className="lb-row__who"><strong>{r.displayName}</strong><small>{r.challenge}</small></span>
                    </span>
                    <span role="cell" className="lb-row__score"><b>{Math.round(r.percentage)}%</b><i aria-hidden="true"><em style={{ width: `${Math.round(r.percentage)}%` }} /></i></span>
                    <span role="cell" className="lb-row__time">{r.timeSeconds}s</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="lb-cta">
          <div><h2 className="lb-cta__title">Can You Make the Top 10?</h2><p>Play any challenge, pick a display name and your best score goes on the board.</p></div>
          <div className="lb-cta__actions"><Link href="/tech-playground/weekly-challenge" className="btn btn-accent">Take the Challenge <ArrowRight size={15} aria-hidden="true" /></Link><Link href="/tech-playground/tech-iq" className="lb-cta__ghost">60-Second Tech IQ</Link></div>
        </div>
      </div>
    </PageShell>
  )
}
