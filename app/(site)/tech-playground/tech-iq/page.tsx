import Link from 'next/link'
import { buildMetadata } from '../../../../lib/seo'
import { getPlaygroundChallengeByKind } from '../../../../lib/playground'
import PageShell from '../../../../components/tech-playground/PageShell'
import PlaygroundQuiz from '../../../../components/tech-playground/PlaygroundQuiz'

const path = '/tech-playground/tech-iq'
const description = 'Race the clock in the 60-Second Tech IQ: rapid-fire questions on programming, databases, web, data and cybersecurity.'
export const metadata = buildMetadata({ title: '60-Second Tech IQ Speed Round | APTECH Abeokuta', description, path })
export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await getPlaygroundChallengeByKind('speed_round')
  return (
    <PageShell path={path} name="60-Second Tech IQ" description={description}>
      {data ? <PlaygroundQuiz challenge={data.challenge as any} questions={data.questions} variant="speed_round" eyebrow="Rapid-fire" extra={<p className="pg-fine">Looking for the classic five-question test? <Link href="/tech-challenge" className="pg-link pg-link--inv">Take the Tech IQ Challenge</Link>.</p>} />
        : <p className="pg-muted">The Tech IQ round is being refreshed. Please check back soon.</p>}
    </PageShell>
  )
}
