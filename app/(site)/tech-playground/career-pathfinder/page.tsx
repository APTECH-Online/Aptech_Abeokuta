import { buildMetadata } from '../../../../lib/seo'
import { getPublicContactInfo } from '../../../../lib/contact-info-public'
import { buildWhatsAppLink } from '../../../../lib/whatsapp'
import PageShell from '../../../../components/tech-playground/PageShell'
import PathwayQuiz from '../../../../components/tech-playground/PathwayQuiz'

const path = '/tech-playground/career-pathfinder'
const description = 'Answer a few questions to discover which tech career and APTECH programme could suit you best, with skills and next steps.'
export const metadata = buildMetadata({ title: 'Tech Career Pathfinder | APTECH Abeokuta', description, path })

export default async function Page() {
  const { whatsapp } = await getPublicContactInfo()
  return <PageShell path={path} name="Tech Career Pathfinder" description={description}><PathwayQuiz mode="pathfinder" whatsappHref={whatsapp ? buildWhatsAppLink(whatsapp, 'Hi APTECH Abeokuta, I just used the Career Pathfinder and would like advice on my next step.') : undefined} /></PageShell>
}
