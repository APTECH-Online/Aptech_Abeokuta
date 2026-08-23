import Hero from '../components/hero/Hero'
import { courses } from '../data/courses'
import CourseCard from '../components/courses/CourseCard'
import Link from 'next/link'

export const metadata = {
  title: 'APTECH Abeokuta — Build Your Future with Technology',
  description:
    'Gain practical IT skills, industry-focused training, and career-ready knowledge at APTECH Abeokuta.'
}

export default function Home() {
  return (
    <>
      <Hero />

      <section className="container py-10">
        <h2 className="text-2xl font-semibold">Popular Programs</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((c) => (
            <CourseCard key={c.slug} course={c} />
          ))}
        </div>
        <div className="mt-6">
          <Link href="/courses" className="text-[var(--color-secondary)] hover:underline">
            View all courses
          </Link>
        </div>
      </section>

      <section className="bg-white border-t py-12">
        <div className="container">
          <h3 className="text-xl font-semibold">Why Choose APTECH</h3>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 border rounded bg-white">
              <h4 className="font-semibold">Practical hands-on training</h4>
              <p className="text-slate-600 mt-2">Applied projects that mirror industry workflows and employer expectations.</p>
            </div>
            <div className="p-4 border rounded bg-white">
              <h4 className="font-semibold">Industry-relevant curriculum</h4>
              <p className="text-slate-600 mt-2">Courses designed to align with current employer needs and technologies.</p>
            </div>
            <div className="p-4 border rounded bg-white">
              <h4 className="font-semibold">Experienced instructors</h4>
              <p className="text-slate-600 mt-2">Instructors with practical industry backgrounds and mentoring experience.</p>
            </div>
            <div className="p-4 border rounded bg-white">
              <h4 className="font-semibold">Career-focused learning</h4>
              <p className="text-slate-600 mt-2">Structured guidance to help students move into roles after training.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
