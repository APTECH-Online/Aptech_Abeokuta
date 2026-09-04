import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import TestimonialsPage from '../../../components/testimonials/TestimonialsPage'

export const metadata = {
  title: { absolute: 'Testimonials | APTECH Abeokuta' },
  description: 'Read student stories about the practical, supported learning experience at APTECH Abeokuta.'
}

export default function TestimonialsRoute() {
  return (
    <>
      <PageHero
        eyebrow="Student stories"
        title="Stories from our learning community"
        description="Hear directly from students in the Advanced Diploma in Software Engineering programme about their experience at APTECH Abeokuta."
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
