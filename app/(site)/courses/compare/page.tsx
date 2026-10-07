import type { Metadata } from 'next'
import PageHero from '../../../../components/shared/PageHero'
import Container from '../../../../components/ui/Container'
import CourseComparison from '../../../../components/courses/CourseComparison'
import { getPublishedCourses } from '../../../../lib/courses-public'
import { buildMetadata } from '../../../../lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Compare IT Programmes in Abeokuta | APTECH Abeokuta',
  description: 'Compare APTECH Abeokuta programmes by duration, learning format, skills, entry requirements, career direction and certification.',
  path: '/courses/compare'
})

type Props = { searchParams: Promise<{ programmes?: string; add?: string }> }

export default async function CompareCoursesPage({ searchParams }: Props) {
  const params = await searchParams
  const courses = await getPublishedCourses()
  const fromProgrammes = params.programmes?.split(',').map((value) => value.trim()).filter(Boolean) ?? []
  const initialSlugs = params.add ? [...fromProgrammes, params.add] : fromProgrammes

  return (
    <>
      <PageHero
        eyebrow="Programme comparison"
        title="Compare programmes before you decide"
        description="Put two or three current programmes side by side so you can compare what you will learn, who each option is for, and where the published skillset can take you."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Courses', href: '/courses' }, { label: 'Compare' }]}
      />
      <section className="section">
        <Container>
          {courses.length >= 2 ? (
            <CourseComparison courses={courses} initialSlugs={initialSlugs} />
          ) : (
            <div className="card p-8 text-center">
              <p className="font-semibold text-[var(--color-ink)]">Programme comparison is temporarily unavailable.</p>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>Please browse the course catalogue or contact admissions for guidance.</p>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
