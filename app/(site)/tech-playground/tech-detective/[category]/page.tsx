import { notFound, redirect } from 'next/navigation'
import { buildMetadata } from '../../../../../lib/seo'
import { getPlaygroundChallengeByKind } from '../../../../../lib/playground'
import PageShell from '../../../../../components/tech-playground/PageShell'
import PlaygroundQuiz from '../../../../../components/tech-playground/PlaygroundQuiz'

const CATS = ['code', 'web', 'sql', 'cyber']
const LABEL: Record<string, string> = { code: 'Code Detective', web: 'Web Detective', sql: 'SQL Detective', cyber: 'Cyber Detective' }
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  if (!CATS.includes(category)) return {}
  return buildMetadata({ title: `${LABEL[category]} Challenge | APTECH Abeokuta`, description: `Play the ${LABEL[category]} case: find the problem before the timer runs out.`, path: `/tech-playground/tech-detective/${category}` })
}

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  if (category === 'data') redirect('/tech-playground/data-detective')
  if (!CATS.includes(category)) notFound()
  const data = await getPlaygroundChallengeByKind('detective', category)
  if (!data) notFound()
  const path = `/tech-playground/tech-detective/${category}`
  return (
    <PageShell path={path} name={LABEL[category]} description={data.challenge.description}>
      <PlaygroundQuiz challenge={data.challenge as any} questions={data.questions} variant="detective" backHref="/tech-playground/tech-detective" backLabel="All case files" eyebrow={LABEL[category]} />
    </PageShell>
  )
}
