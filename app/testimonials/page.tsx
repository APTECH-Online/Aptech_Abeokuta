import PageHero from '../../components/shared/PageHero'
import Container from '../../components/ui/Container'
import TestimonialsPage from '../../components/testimonials/TestimonialsPage'

export const metadata = {
  title: { absolute: 'Testimonials | APTECH Abeokuta' },
  description: 'Read illustrative student stories and learn about the practical, supported learning experience described on the APTECH Abeokuta website.'
}

export default function TestimonialsRoute() {
  return (
    <>
      <PageHero
        eyebrow="Student stories"
        title="Stories from our learning community"
        description="A dedicated space for student experiences. Until genuine, verified testimonials are supplied, every story on this page is clearly identified as a placeholder."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Testimonials' }]}
      />
      <section className="section">
        <Container>
          <TestimonialsPage />
        </Container>
      </section>
    </>
  )
}
