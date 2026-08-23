import Link from 'next/link'
import Image from 'next/image'
import { Course } from '../../data/courses'

const iconMap: Record<string,string> = {
  'Software Development': '/images/course-dev.svg',
  'Data & Analytics': '/images/course-data.svg',
  'Digital Skills': '/images/course-digital.svg',
  'Professional IT': '/images/course-it.svg'
}

export default function CourseCard({ course }: { course: Course }){
  const icon = iconMap[course.category] || '/images/course-dev.svg'
  return (
    <article className="border rounded p-4 bg-white hover:shadow-lg transition-shadow focus-within:shadow-lg" tabIndex={0} aria-labelledby={`course-${course.slug}`}>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 flex-shrink-0">
          <Image src={icon} alt={`${course.category} icon`} width={64} height={64} />
        </div>
        <div>
          <h3 id={`course-${course.slug}`} className="font-semibold">{course.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{course.description}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-600">{course.duration}</div>
        <Link href={`/courses/${course.slug}`} className="text-[var(--color-secondary)] font-medium hover:underline">View Course</Link>
      </div>
    </article>
  )
}
