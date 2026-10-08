import { buildMetadata } from '../../../../lib/seo'
import { getStreakDays } from '../../../../lib/playground'
import PageShell from '../../../../components/tech-playground/PageShell'
import StreakBoard from '../../../../components/tech-playground/StreakBoard'

const path = '/tech-playground/7-day-challenge'
const description = 'Complete one small tech challenge a day for seven days, from digital skills to cybersecurity, and earn the 7-Day Tech Explorer badge.'
export const metadata = buildMetadata({ title: '7-Day Tech Streak Challenge | APTECH Abeokuta', description, path })
export const dynamic = 'force-dynamic'

export default async function Page() {
  const days = await getStreakDays()
  return (
    <PageShell path={path} name="7-Day Tech Streak" description={description}>
      {days.length === 7 ? <StreakBoard days={days} /> : <p className="pg-muted">The 7-day challenge is being prepared. Please check back soon.</p>}
    </PageShell>
  )
}
