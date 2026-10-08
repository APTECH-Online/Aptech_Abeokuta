import Link from 'next/link'
import { getPublishedCourses } from '../../../lib/courses-public'
import { getInsightsBySlugs } from '../../../lib/insights-public'
import { INSIGHT_TOPICS } from '../../../lib/topics'
import CourseSearch from '../../../components/courses/CourseSearch'
import GuideCards from '../../../components/courses/GuideCards'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import { breadcrumbJsonLd } from '../../../lib/structured-data'
import { buildMetadata, getSiteUrl } from '../../../lib/seo'
import JsonLd from '../../../components/shared/JsonLd'

// Hourly safety net; CRM course/insight actions also revalidate this page on every change.
export const revalidate = 3600

export const metadata = buildMetadata({
  title: 'IT Courses in Abeokuta | Diploma, Smart Pro & Short Courses',
  description:
    'Browse APTECH Abeokuta programmes: Advanced Diploma in Software Engineering, Smart Pro, Aptech Certified Network Specialist and short IT courses.',
  path: '/courses'
})

export default async function CoursesPage() {
  const baseUrl = getSiteUrl()
  const courses = await getPublishedCourses()
  // The editorial guides, so the catalogue hub links to every guide that helps someone choose a course.
  const guides = await getInsightsBySlugs(Object.keys(INSIGHT_TOPICS))
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
          {courses.length >= 2 && (
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 card p-5" style={{ background: 'var(--color-paper-alt)' }}>
              <div>
                <p className="font-semibold text-[var(--color-ink)]">Considering more than one option?</p>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>Compare two or three programmes by skills, duration, requirements and learning format.</p>
              </div>
              <Link href="/courses/compare" className="btn btn-secondary shrink-0">Compare programmes</Link>
            </div>
          )}
        </Container>
      </section>

      <GuideCards guides={guides} />
    </>
  )
}
