import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import LegalDocument from '../../../components/legal/LegalDocument'
import { buildMetadata } from '../../../lib/seo'
import { getPublicContactInfo } from '../../../lib/contact-info-public'
import { getPublishedLegal } from '../../../lib/legal-public'

export const metadata = buildMetadata({
  title: 'Terms & Conditions | APTECH Abeokuta',
  description:
    'Terms and conditions for using the APTECH Abeokuta website, enquiring about our programmes, enrolling and studying with us.',
  path: '/terms'
})

export default async function Terms() {
  const [doc, contact] = await Promise.all([getPublishedLegal('terms'), getPublicContactInfo()])
  return (
    <>
      <PageHero eyebrow="Legal" title={doc.title} crumbs={[{ label: 'Home', href: '/' }, { label: 'Terms' }]} />
      <section className="section">
        <Container className="max-w-3xl">
          <LegalDocument doc={doc} tokens={{ email: contact.email, phone: contact.phone, address: contact.address }} />
        </Container>
      </section>
    </>
  )
}
