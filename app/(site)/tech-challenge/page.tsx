import { buildMetadata } from '../../../lib/seo'
import { getPublicContactInfo } from '../../../lib/contact-info-public'
import Container from '../../../components/ui/Container'
import TechChallenge from '../../../components/home/TechChallenge'

export const metadata = buildMetadata({
  title: 'Tech IQ Challenge | APTECH Abeokuta',
  description: 'Take the five-question APTECH Abeokuta Tech IQ Challenge and test your technology instincts.',
  path: '/tech-challenge'
})

export default async function TechChallengePage() {
  const { whatsapp } = await getPublicContactInfo()
  return <section className="section"><Container className="max-w-4xl"><TechChallenge whatsapp={whatsapp} /></Container></section>
}
