import { courses } from '../../../data/courses'
import CourseSearch from '../../../components/courses/CourseSearch'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'

export const metadata = {
  title: 'Courses',
  description: 'Explore APTECH Abeokuta course offerings: Advanced Diploma in Software Engineering, Smart Pro, Aptech Certified Network Specialist, and short-term courses.'
}

export default function CoursesPage() {
  return (
    <>
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
