import { buildMetadata } from '../../../../lib/seo'
import { getPublicContactInfo } from '../../../../lib/contact-info-public'
import { buildWhatsAppLink } from '../../../../lib/whatsapp'
import PageShell from '../../../../components/tech-playground/PageShell'
import PathwayQuiz from '../../../../components/tech-playground/PathwayQuiz'

const path = '/tech-playground/tech-career-quiz'
const description = 'A fast, fun quiz that matches your instincts to tech careers like software development, data analytics, cybersecurity and more.'
export const metadata = buildMetadata({ title: 'What Tech Career Fits You? Quiz | APTECH Abeokuta', description, path })

export default async function Page() {
  const { whatsapp } = await getPublicContactInfo()
  return <PageShell path={path} name="What Tech Career Fits You?" description={description}><PathwayQuiz mode="quiz" whatsappHref={whatsapp ? buildWhatsAppLink(whatsapp, 'Hi APTECH Abeokuta, I took the Tech Career Quiz and would like to talk about my result.') : undefined} /></PageShell>
}
