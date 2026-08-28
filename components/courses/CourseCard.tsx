import Link from 'next/link'
import Image from 'next/image'
import { Course } from '../../data/courses'
import CourseIcon from '../ui/CourseIcon'

const coverStyles: Record<string, { bg: string; fg: string }> = {
  'Advanced Diploma': { bg: 'var(--color-navy-900)', fg: 'rgba(239,192,119,0.9)' },
  'Smart Pro': { bg: 'var(--color-teal-700)', fg: 'rgba(255,255,255,0.85)' },
  'Aptech Certified Network Specialist': { bg: 'var(--color-navy-700)', fg: 'rgba(239,192,119,0.9)' },
  'Short Term Courses': { bg: 'var(--color-amber-500)', fg: 'rgba(20,20,20,0.85)' }
}

export default function CourseCard({ course }: { course: Course }) {
  const cover = coverStyles[course.category] ?? coverStyles['Aptech Certified Network Specialist']

  return (
    <article className="card card-interactive flex flex-col h-full overflow-hidden group">
      <div
        className="relative h-36 flex items-center justify-center overflow-hidden pattern-adire"
        style={{ background: cover.bg }}
      >
        {course.coverImage ? (
          <Image
            src={course.coverImage}
            alt={`${course.title} curriculum`}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <div
            className="transition-transform duration-300 ease-out group-hover:scale-110"
            style={{ color: cover.fg }}
          >
            <CourseIcon category={course.category} slug={course.slug} className="w-16 h-16" />
          </div>
        )}
        <span className="absolute top-3 left-3 badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(4px)' }}>
          {course.category}
        </span>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-[1.05rem] font-semibold text-[var(--color-ink)] font-display">
          {course.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed line-clamp-3" style={{ color: 'var(--color-body)' }}>
          {course.summary}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
          <div>
            <dt className="eyebrow" style={{ fontSize: '0.62rem' }}>Duration</dt>
            <dd className="mt-1" style={{ color: 'var(--color-body)' }}>{course.duration}</dd>
          </div>
          <div>
            <dt className="eyebrow" style={{ fontSize: '0.62rem' }}>Level</dt>
            <dd className="mt-1" style={{ color: 'var(--color-body)' }}>{course.level}</dd>
          </div>
        </dl>

        <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-line)' }}>
          <Link
            href={`/courses/${course.slug}`}
            className="text-sm font-semibold inline-flex items-center gap-1.5 transition-transform duration-150 group-hover:translate-x-0.5"
            style={{ color: 'var(--color-navy-900)' }}
          >
            View programme
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
