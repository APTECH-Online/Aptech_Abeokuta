import PageHero from '../../components/shared/PageHero'
import Container from '../../components/ui/Container'

export const metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions for APTECH Abeokuta.'
}

export default function Terms() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms & conditions"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Terms' }]}
      />
      <section className="section">
        <Container className="max-w-2xl">
          <div className="card p-8">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
              This page is a placeholder for APTECH Abeokuta's terms and conditions. Replace
              this content with terms that accurately describe enrolment, payment, attendance,
              and conduct policies for the institution.
            </p>
          </div>
        </Container>
      </section>
    </>
  )
}
