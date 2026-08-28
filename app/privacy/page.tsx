import PageHero from '../../components/shared/PageHero'
import Container from '../../components/ui/Container'

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for APTECH Abeokuta.'
}

export default function Privacy() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy policy"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy' }]}
      />
      <section className="section">
        <Container className="max-w-2xl">
          <div className="card p-8">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
              This page is a placeholder for APTECH Abeokuta's privacy policy. Replace this
              content with a policy that accurately describes what information is collected
              through this site (for example, contact and application form submissions), how
              it is used and stored, and how visitors can request its removal.
            </p>
          </div>
        </Container>
      </section>
    </>
  )
}
