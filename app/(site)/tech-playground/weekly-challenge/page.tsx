import Link from 'next/link'
import { buildMetadata } from '../../../../lib/seo'
import { getActiveWeekly, getChallengeHighScore, nextWeeklyReset } from '../../../../lib/playground'
import PageShell from '../../../../components/tech-playground/PageShell'
import PlaygroundQuiz from '../../../../components/tech-playground/PlaygroundQuiz'

const path = '/tech-playground/weekly-challenge'
const description = 'A fresh APTECH Tech Challenge every week. Beat the clock, climb the Tech Arena leaderboard and come back to beat your best.'
export const metadata = buildMetadata({ title: 'Weekly Tech Challenge | APTECH Abeokuta', description, path })
export const dynamic = 'force-dynamic'

const dateFmt = new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Lagos' })

export default async function Page() {
  const weekly = await getActiveWeekly()
  if (!weekly) return (
    <PageShell path={path} name="Weekly Tech Challenge" description={description}>
      <div className="pg-stage pg-stage--intro"><p className="pg-eyebrow">🔥 This week&apos;s tech challenge</p><h1 className="pg-title">The next challenge is on its way</h1><p className="pg-lede">A new weekly challenge will appear here soon. In the meantime, try the speed round.</p><Link className="btn btn-accent" href="/tech-playground/tech-iq">Play 60-Second Tech IQ</Link></div>
    </PageShell>
  )
  const high = await getChallengeHighScore(weekly.challenge.id)
  const closes = weekly.meta.end_date ? new Date(weekly.meta.end_date) : nextWeeklyReset()
  return (
    <PageShell path={path} name="Weekly Tech Challenge" description={description}>
      <PlaygroundQuiz
        challenge={weekly.challenge as any} questions={weekly.questions} variant="weekly" eyebrow="🔥 This week's tech challenge"
        extra={<ul className="pg-meta pg-meta--stack">
          <li>Current highest score: <strong>{high ? `${Math.round(high.percentage)}% by ${high.name}` : 'Be the first!'}</strong></li>
          <li>{weekly.meta.end_date ? 'Closes' : 'Refreshes'}: <strong>{dateFmt.format(closes)}</strong></li>
        </ul>}
      />
    </PageShell>
  )
}
