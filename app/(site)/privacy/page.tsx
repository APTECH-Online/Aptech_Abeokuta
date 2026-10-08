import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import LegalDocument from '../../../components/legal/LegalDocument'
import { buildMetadata } from '../../../lib/seo'
import { getPublicContactInfo } from '../../../lib/contact-info-public'
import { getPublishedLegal } from '../../../lib/legal-public'

export const metadata = buildMetadata({
  title: 'Privacy Policy | APTECH Abeokuta',
  description:
    'How APTECH Abeokuta collects, uses, shares and protects personal information submitted through this website, and your rights under Nigerian data protection law.',
  path: '/privacy'
})

export default async function Privacy() {
  const [doc, contact] = await Promise.all([getPublishedLegal('privacy'), getPublicContactInfo()])
  return (
    <>
      <PageHero eyebrow="Legal" title={doc.title} crumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy' }]} />
      <section className="section">
        <Container className="max-w-3xl">
          <LegalDocument doc={doc} tokens={{ email: contact.email, phone: contact.phone, address: contact.address }} />
        </Container>
      </section>
    </>
  )
}
