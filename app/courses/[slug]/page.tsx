import { courses } from '../../../data/courses'

type Props = { params: { slug: string } }

export async function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }))
}

export default function CoursePage({ params }: Props) {
  const course = courses.find((c) => c.slug === params.slug)
  if (!course) return <div className="container py-12">Course not found</div>

  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold">{course.title}</h1>
      <p className="mt-4 text-muted">{course.category} • {course.duration} • {course.level}</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h3 className="text-xl font-semibold">Overview</h3>
          <p className="mt-2">{course.description}</p>

          <h4 className="mt-6 font-semibold">What you'll learn</h4>
          <ul className="list-disc ml-6 mt-2 text-muted">
            <li>Practical projects</li>
            <li>Industry-relevant tools</li>
            <li>Career guidance</li>
          </ul>
        </div>

        <aside className="p-4 border rounded">
          <p><strong>Duration:</strong> {course.duration}</p>
          <p className="mt-2"><strong>Level:</strong> {course.level}</p>
          <div className="mt-4">
            <button className="w-full bg-[var(--color-secondary)] text-white px-3 py-2 rounded">Enroll Now</button>
          </div>
        </aside>
      </div>
    </section>
  )
}
