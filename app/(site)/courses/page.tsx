import { getPublishedCourses } from '../../../lib/courses-public'
import CourseSearch from '../../../components/courses/CourseSearch'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import { breadcrumbJsonLd } from '../../../lib/structured-data'

export const metadata = {
  title: 'Courses',
  description: 'Explore APTECH Abeokuta course offerings: Advanced Diploma in Software Engineering, Smart Pro, Aptech Certified Network Specialist, and short-term courses.',
  alternates: { canonical: '/courses' },
  openGraph: {
    title: 'Courses — APTECH Abeokuta',
    description: 'Explore APTECH Abeokuta course offerings: Advanced Diploma in Software Engineering, Smart Pro, Aptech Certified Network Specialist, and short-term courses.',
    url: '/courses'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Courses — APTECH Abeokuta',
    description: 'Explore APTECH Abeokuta course offerings: Advanced Diploma in Software Engineering, Smart Pro, Aptech Certified Network Specialist, and short-term courses.'
  }
}

export default async function CoursesPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
  const courses = await getPublishedCourses()
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Courses' }]))
        }}
      />
      <PageHero
        eyebrow="Course catalogue"
        title="Find your programme"
        description="Explore the programme areas at APTECH Abeokuta, including the Advanced Diploma in Software Engineering, Smart Pro, Aptech Certified Network Specialist, and our short-term courses."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Courses' }]}
      />
      <section className="section">
        <Container>
          <CourseSearch initialCourses={courses} />
        </Container>
      </section>
    </>
  )
}
