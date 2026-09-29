import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import TestimonialsPage from '../../../components/testimonials/TestimonialsPage'
import { breadcrumbJsonLd } from '../../../lib/structured-data'
import { getPublishedTestimonials } from '../../../lib/testimonials-public'
import { buildMetadata, getSiteUrl } from '../../../lib/seo'
import JsonLd from '../../../components/shared/JsonLd'

export const metadata = buildMetadata({
  title: 'Student Testimonials | APTECH Abeokuta',
  description:
    'Read student stories about the practical, supported learning experience at APTECH Abeokuta.',
  path: '/testimonials'
})

export default async function TestimonialsRoute() {
  const testimonials = await getPublishedTestimonials()
  const baseUrl = getSiteUrl()
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Testimonials' }])} />
      <PageHero
        eyebrow="Student stories"
        title="Student testimonials from APTECH Abeokuta"
        description="Hear directly from students in the Advanced Diploma in Software Engineering programme about their experience at APTECH Abeokuta."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Testimonials' }]}
      />
      <section className="section">
        <Container>
          <TestimonialsPage testimonials={testimonials} />
        </Container>
      </section>
    </>
  )
}
