import Link from 'next/link'
import { ArrowRight, BadgeCheck, BarChart3, CalendarDays, Code2, Compass, Flame, Search, Sparkles, Trophy, Zap, CircleDot } from 'lucide-react'
import { buildMetadata } from '../../../lib/seo'
import { getLeaderboard, getActiveWeekly, getChallengeHighScore } from '../../../lib/playground'
import PageShell from '../../../components/tech-playground/PageShell'
import { EXPERIENCES } from '../../../data/playground'

const path = '/tech-playground'
const description = 'Test your skills, discover your ideal tech career, solve challenges, compete on the leaderboard and see where your tech journey could take you.'
export const metadata = buildMetadata({ title: 'Tech Playground: Challenges, Quizzes & Tech Careers | APTECH Abeokuta', description, path })
export const revalidate = 60

const icons: Record<string, any> = { compass: Compass, sparkles: Sparkles, flame: Flame, zap: Zap, search: Search, chart: BarChart3, code: Code2, calendar: CalendarDays, wheel: CircleDot, trophy: Trophy, badge: BadgeCheck }

export default async function TechPlaygroundPage() {
  const [top, weekly] = await Promise.all([getLeaderboard('week', 3).catch(() => []), getActiveWeekly().catch(() => null)])
  const high = weekly ? await getChallengeHighScore(weekly.challenge.id).catch(() => null) : null
  return (
    <PageShell path={path} name="Tech Playground" description={description} narrow={false} flush>
      <div className="pg-hero">
        <p className="pg-eyebrow">APTECH Abeokuta Tech Playground</p>
        <h1 className="pg-hero__title">Think You&apos;ve Got What It Takes?</h1>
        <p className="pg-hero__lede">Test your skills, discover your ideal tech career, solve challenges, compete with others and see where your tech journey could take you.</p>
        <div className="pg-actions pg-actions--center">
          <Link href="#experiences" className="btn btn-accent">Start Exploring <ArrowRight size={16} /></Link>
          <Link href="/tech-playground/career-pathfinder" className="btn pg-btn-ghost">Find Your Tech Career</Link>
        </div>
        <ul className="pg-hero__stats" aria-label="Highlights">
          <li><strong>{EXPERIENCES.length - 2}</strong> experiences</li><li><strong>Free</strong> to play</li><li><strong>No</strong> sign-up needed</li>
        </ul>
      </div>

      {weekly && (
        <Link href="/tech-playground/weekly-challenge" className="pg-spotlight">
          <span className="pg-spotlight__tag"><Flame size={15} /> This week&apos;s tech challenge</span>
          <strong>{weekly.challenge.name}</strong>
          <span>{weekly.questions.length} questions{weekly.challenge.time_limit_seconds ? ` · ${weekly.challenge.time_limit_seconds} seconds` : ''} · <span className="capitalize">{weekly.challenge.difficulty}</span>{high ? ` · Top score ${Math.round(high.percentage)}%` : ''}</span>
          <em>Take the challenge <ArrowRight size={14} /></em>
        </Link>
      )}

      <h2 id="experiences" className="pg-h2 pg-h2--section">Pick your challenge</h2>
      <ul className="pg-cards">
        {EXPERIENCES.map((e) => { const Icon = icons[e.icon] ?? Sparkles; return (
          <li key={e.href}><Link href={e.href} className="pg-card">
            <span className="pg-card__top"><span className="pg-card__icon"><Icon size={22} /></span><span className="pg-tag">{e.tag}</span></span>
            <strong>{e.title}</strong><span>{e.text}</span>
            <em>{e.time ? `${e.time} · ` : ''}Play <ArrowRight size={14} /></em>
          </Link></li>
        )})}
      </ul>

      <div className="pg-arena">
        <div><p className="pg-eyebrow">Tech Arena</p><h2 className="pg-h2">Can You Make the Top 10?</h2>
          {top.length > 0 ? <ol className="pg-mini">{top.map((r) => <li key={r.rank}><span>{['🥇', '🥈', '🥉'][r.rank - 1]}</span> <strong>{r.displayName}</strong> <em>{Math.round(r.percentage)}%</em></li>)}</ol> : <p className="pg-muted">The board is open. Be the first name on it.</p>}
        </div>
        <div className="pg-actions"><Link href="/tech-playground/weekly-challenge" className="btn btn-accent">Take the Challenge</Link><Link href="/tech-playground/leaderboard" className="btn btn-secondary">View Leaderboard</Link></div>
      </div>

      <div className="pg-cta-band">
        <h2 className="pg-h2">Ready to turn curiosity into a career?</h2>
        <p>APTECH Abeokuta offers hands-on, career-focused programmes. Explore the courses or talk to an advisor.</p>
        <div className="pg-actions pg-actions--center"><Link href="/courses" className="btn btn-accent">Explore Programmes</Link><Link href="/contact" className="btn pg-btn-ghost">Talk to an Advisor</Link></div>
      </div>
    </PageShell>
  )
}
