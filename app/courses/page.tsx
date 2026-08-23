import { courses } from '../../data/courses'
import CourseCard from '../../components/courses/CourseCard'
import CourseSearch from '../../components/courses/CourseSearch'

export const metadata = {
  title: 'Courses — APTECH Abeokuta',
  description: 'Explore APTECH Abeokuta course offerings and programs.'
}

export default function CoursesPage() {
  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold">Courses</h1>
      <div className="mt-6">
        <CourseSearch initialCourses={courses} />
      </div>
    </section>
  )
}
