import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import TestimonialsPage from '../../../components/testimonials/TestimonialsPage'
import { breadcrumbJsonLd } from '../../../lib/structured-data'

export const metadata = {
  title: { absolute: 'Testimonials | APTECH Abeokuta' },
  description: 'Read student stories about the practical, supported learning experience at APTECH Abeokuta.',
  alternates: { canonical: '/testimonials' },
  openGraph: {
    title: 'Testimonials | APTECH Abeokuta',
    description: 'Read student stories about the practical, supported learning experience at APTECH Abeokuta.',
    url: '/testimonials'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Testimonials | APTECH Abeokuta',
    description: 'Read student stories about the practical, supported learning experience at APTECH Abeokuta.'
  }
}

export default function TestimonialsRoute() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Testimonials' }]))
        }}
      />
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
