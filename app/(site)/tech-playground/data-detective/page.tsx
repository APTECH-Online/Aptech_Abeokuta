import { buildMetadata } from '../../../../lib/seo'
import { getPlaygroundChallengeByKind } from '../../../../lib/playground'
import PageShell from '../../../../components/tech-playground/PageShell'
import PlaygroundQuiz from '../../../../components/tech-playground/PlaygroundQuiz'

const path = '/tech-playground/data-detective'
const description = 'Study a small sales dataset and answer like a data analyst: spot the best month, the trend and the right conclusion.'
export const metadata = buildMetadata({ title: 'Data Detective Challenge | APTECH Abeokuta', description, path })
export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await getPlaygroundChallengeByKind('data_detective')
  return (
    <PageShell path={path} name="Data Detective" description={description}>
      {data ? <PlaygroundQuiz challenge={data.challenge as any} questions={data.questions} variant="data_detective" eyebrow="Data & Analytics" />
        : <p className="pg-muted">This case file is being updated. Please check back soon.</p>}
    </PageShell>
  )
}
