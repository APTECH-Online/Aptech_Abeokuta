import Link from 'next/link'
import { ArrowRight, BadgeCheck, BarChart3, CalendarDays, Clock, Code2, Compass, Flame, Gift, LayoutGrid, Search, ShieldCheck, Sparkles, Trophy, Zap, CircleDot } from 'lucide-react'
import { buildMetadata } from '../../../lib/seo'
import { getLeaderboard, getActiveWeekly, getChallengeHighScore } from '../../../lib/playground'
import PageShell from '../../../components/tech-playground/PageShell'
import { EXPERIENCES } from '../../../data/playground'

const path = '/tech-playground'
const description = 'Test your skills, discover your ideal tech career, solve challenges, compete on the leaderboard and see where your tech journey could take you.'
export const metadata = buildMetadata({ title: 'Tech Playground: Challenges, Quizzes & Tech Careers | APTECH Abeokuta', description, path })
export const revalidate = 60

const icons: Record<string, any> = { compass: Compass, sparkles: Sparkles, flame: Flame, zap: Zap, search: Search, chart: BarChart3, code: Code2, calendar: CalendarDays, wheel: CircleDot, trophy: Trophy, badge: BadgeCheck }

const cardThemes = [
  'blue', 'lavender', 'mint', 'orange', 'cyan', 'violet', 'pink', 'gold', 'sky', 'teal', 'purple'
] as const

const initials = (name: string) => (name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('') || '?').toUpperCase()

export default async function TechPlaygroundPage() {
  const [top, weekly] = await Promise.all([getLeaderboard('week', 3).catch(() => []), getActiveWeekly().catch(() => null)])
  const high = weekly ? await getChallengeHighScore(weekly.challenge.id).catch(() => null) : null
  return (
    <PageShell path={path} name="Tech Playground" description={description} narrow={false} flush>
      <div className="hub-hero">
        <div className="hub-hero__glow" aria-hidden="true" />
        <div className="hub-hero__dots" aria-hidden="true" />
        <p className="hub-hero__badge"><Sparkles size={13} aria-hidden="true" /> APTECH Abeokuta Tech Playground</p>
        <h1 className="hub-hero__title">Think You&apos;ve Got What It Takes?</h1>
        <p className="hub-hero__lede">Test your skills, discover your ideal tech career, solve challenges, compete with others and see where your tech journey could take you.</p>
        <div className="hub-hero__actions">
          <Link href="#experiences" className="btn btn-accent">Start Exploring <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link href="/tech-playground/career-pathfinder" className="hub-hero__ghost">Find Your Tech Career</Link>
        </div>
        <ul className="hub-hero__stats" aria-label="Highlights">
          <li><span aria-hidden="true"><LayoutGrid size={16} /></span><strong>{EXPERIENCES.length - 2}</strong><em>experiences</em></li>
          <li><span aria-hidden="true"><Gift size={16} /></span><strong>Free</strong><em>to play</em></li>
          <li><span aria-hidden="true"><ShieldCheck size={16} /></span><strong>No</strong><em>sign-up needed</em></li>
        </ul>
      </div>

      {weekly && (
        <Link href="/tech-playground/weekly-challenge" className="hub-spot">
          <span className="hub-spot__icon" aria-hidden="true"><Flame size={24} /></span>
          <span className="hub-spot__body">
            <span className="hub-spot__tag">This week&apos;s tech challenge</span>
            <strong>{weekly.challenge.name}</strong>
            <span className="hub-spot__chips">
              <span>{weekly.questions.length} questions</span>
              {weekly.challenge.time_limit_seconds ? <span>{weekly.challenge.time_limit_seconds} seconds</span> : null}
              <span className="capitalize">{weekly.challenge.difficulty}</span>
              {high ? <span className="is-gold"><Trophy size={11} aria-hidden="true" /> Top score {Math.round(high.percentage)}%</span> : null}
            </span>
          </span>
          <span className="hub-spot__cta">Take the challenge <ArrowRight size={15} aria-hidden="true" /></span>
        </Link>
      )}

      <div className="hub-head">
        <p className="pgx-badge pgx-badge--light"><Sparkles size={13} aria-hidden="true" /> Experiences</p>
        <h2 id="experiences" className="hub-head__title">Pick your challenge</h2>
        <p>Sharpen your skills, test your knowledge and have fun. Choose a challenge and see what you&apos;re made of!</p>
      </div>
      <ul className="pg-cards">
        {EXPERIENCES.map((e, index) => {
          const Icon = icons[e.icon] ?? Sparkles
          const theme = cardThemes[index % cardThemes.length]
          return (
            <li key={e.href}>
              <Link href={e.href} className={`pg-card pg-card--${theme}`}>
                <span className="pg-card__top">
                  <span className="pg-card__icon"><Icon size={21} strokeWidth={2.1} /></span>
                  <span className="pg-tag">{e.tag}</span>
                </span>
                <span className="pg-card__content">
                  <strong>{e.title}</strong>
                  <span>{e.text}</span>
                </span>
                <span className="pg-card__foot">
                  {e.time ? <span className="pg-card__time"><Clock size={12} aria-hidden="true" /> {e.time}</span> : <span />}
                  <em>Play <ArrowRight size={14} aria-hidden="true" /></em>
                </span>
                <span className="pg-card__art" aria-hidden="true"><Icon size={104} strokeWidth={1.15} /></span>
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="hub-arena">
        <div className="hub-arena__copy">
          <p className="pgx-badge pgx-badge--light"><Trophy size={13} aria-hidden="true" /> Tech Arena</p>
          <h2 className="hub-head__title">Can You Make the Top 10?</h2>
          <p>Play any challenge, pick a display name and your best score goes on the board.</p>
          <div className="hub-arena__actions"><Link href="/tech-playground/weekly-challenge" className="btn btn-accent">Take the Challenge <ArrowRight size={15} aria-hidden="true" /></Link><Link href="/tech-playground/leaderboard" className="btn btn-secondary">View Leaderboard</Link></div>
        </div>
        {top.length > 0 ? (
          <ol className="hub-board" aria-label="Top players this week">
            {top.map((r) => (
              <li key={r.rank} className={`hub-board__row hub-board__row--${r.rank}`}>
                <span className="hub-board__medal" aria-hidden="true">{['🥇', '🥈', '🥉'][r.rank - 1]}</span>
                <span className="lb-avatar" aria-hidden="true">{initials(r.displayName)}</span>
                <strong>{r.displayName}</strong>
                <em>{Math.round(r.percentage)}%</em>
              </li>
            ))}
          </ol>
        ) : (
          <div className="hub-board hub-board--empty"><Trophy size={22} aria-hidden="true" /><p>The board is open. Be the first name on it.</p></div>
        )}
      </div>

      <div className="hub-cta">
        <div className="hub-cta__glow" aria-hidden="true" />
        <h2 className="hub-cta__title">Ready to turn curiosity into a career?</h2>
        <p>APTECH Abeokuta offers hands-on, career-focused programmes. Explore the courses or talk to an advisor.</p>
        <div className="hub-cta__actions"><Link href="/courses" className="btn btn-accent">Explore Programmes <ArrowRight size={15} aria-hidden="true" /></Link><Link href="/contact" className="hub-hero__ghost">Talk to an Advisor</Link></div>
      </div>
    </PageShell>
  )
}
