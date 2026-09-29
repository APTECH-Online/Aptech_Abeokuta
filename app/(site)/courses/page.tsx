import { getPublishedCourses } from '../../../lib/courses-public'
import CourseSearch from '../../../components/courses/CourseSearch'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import { breadcrumbJsonLd } from '../../../lib/structured-data'
import { buildMetadata, getSiteUrl } from '../../../lib/seo'
import JsonLd from '../../../components/shared/JsonLd'

export const metadata = buildMetadata({
  title: 'IT Courses in Abeokuta | Diploma, Smart Pro & Short Courses',
  description:
    'Browse APTECH Abeokuta programmes: Advanced Diploma in Software Engineering, Smart Pro, Aptech Certified Network Specialist and short IT courses.',
  path: '/courses'
})

export default async function CoursesPage() {
  const baseUrl = getSiteUrl()
  const courses = await getPublishedCourses()
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Courses' }])} />
      <PageHero
        eyebrow="Course catalogue"
        title="Courses & programmes at APTECH Abeokuta"
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
