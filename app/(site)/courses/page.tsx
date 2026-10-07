import Link from 'next/link'
import { getPublishedCourses } from '../../../lib/courses-public'
import { getInsightsBySlugs } from '../../../lib/insights-public'
import { INSIGHT_TOPICS } from '../../../lib/topics'
import CourseSearch from '../../../components/courses/CourseSearch'
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

      {guides.length > 0 && (
        <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)' }}>
          <Container>
            <h2 className="h-section">Not sure which course to choose?</h2>
            <p className="lede mt-3 max-w-2xl">
              These guides explain the options in plain language, and each links to the matching APTECH Abeokuta courses.
              You can also <Link href="/contact" className="font-semibold underline" style={{ color: 'var(--color-teal-700)' }}>ask the admissions team</Link>.
            </p>
            <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((g) => (
                <li key={g.slug} className="card p-5">
                  <h3 className="font-display font-semibold text-sm text-[var(--color-ink)] leading-snug">
                    <Link href={`/insights/${g.slug}`} className="hover:underline">{g.title}</Link>
                  </h3>
                  {g.short_description && (
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>{g.short_description}</p>
                  )}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  )
}
