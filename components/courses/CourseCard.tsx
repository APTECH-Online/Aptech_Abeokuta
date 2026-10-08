import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BarChart3, Clock, MapPin } from 'lucide-react'
import { admissionUi } from '../../lib/admission'
import { Course } from '../../data/courses'
import CourseIcon from '../ui/CourseIcon'
import CompareCourseButton from './CompareCourseButton'

const coverStyles: Record<string, { bg: string; fg: string; accent: string }> = {
  'Advanced Diploma': { bg: 'linear-gradient(135deg, var(--color-navy-950), var(--color-navy-800))', fg: 'var(--color-amber-400)', accent: 'var(--color-navy-700)' },
  'Smart Pro': { bg: 'linear-gradient(135deg, var(--color-teal-700), #0b5f50)', fg: '#ffffff', accent: 'var(--color-teal-700)' },
  'Aptech Certified Network Specialist': { bg: 'linear-gradient(135deg, var(--color-navy-700), var(--color-navy-900))', fg: 'var(--color-amber-400)', accent: 'var(--color-navy-700)' },
  'Short Term Courses': { bg: 'linear-gradient(135deg, var(--color-amber-500), #c98a1e)', fg: '#2a1c04', accent: 'var(--color-amber-700)' }
}

const MAX_TOOLS = 3

export default function CourseCard({ course }: { course: Course }) {
  const cover = coverStyles[course.category] ?? coverStyles['Aptech Certified Network Specialist']
  const status = course.admissionStatus !== 'open' ? admissionUi(course.admissionStatus) : null
  const tools = (course.tools ?? []).filter(Boolean)
  const shownTools = tools.slice(0, MAX_TOOLS)
  const extra = tools.length - shownTools.length

  return (
    <article className="cc group" style={{ ['--cc-accent' as any]: cover.accent }}>
      <div className="cc__cover pattern-adire" style={{ background: cover.bg }}>
        {course.coverImage ? (
          <Image
            src={course.coverImage}
            alt={`${course.title} curriculum`}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="cc__img"
          />
        ) : (
          <span className="cc__watermark" style={{ color: cover.fg }} aria-hidden="true">
            <CourseIcon category={course.category} slug={course.slug} className="w-full h-full" />
          </span>
        )}
        <span className="cc__shade" aria-hidden="true" />
        <span className="cc__category">{course.category}</span>
        {status && (
          <span className="cc__status">
            <i style={{ background: status.dot }} aria-hidden="true" />{status.statusLabel}
          </span>
        )}
      </div>

      <div className="cc__body">
        <span className="cc__tile" style={{ color: cover.accent }} aria-hidden="true">
          <CourseIcon category={course.category} slug={course.slug} className="w-7 h-7" />
        </span>

        <h3 className="cc__title">
          <Link href={`/courses/${course.slug}`} className="cc__link">{course.title}</Link>
        </h3>
        <p className="cc__summary">{course.summary}</p>

        <ul className="cc__meta" aria-label="Programme details">
          {course.duration && <li><Clock size={13} aria-hidden="true" /><span className="sr-only">Duration: </span>{course.duration}</li>}
          {course.level && <li><BarChart3 size={13} aria-hidden="true" /><span className="sr-only">Level: </span>{course.level}</li>}
          {course.mode && <li><MapPin size={13} aria-hidden="true" /><span className="sr-only">Mode: </span>{course.mode}</li>}
        </ul>

        {shownTools.length > 0 && (
          <ul className="cc__tools" aria-label="Tools you will use">
            {shownTools.map((t) => <li key={t}>{t}</li>)}
            {extra > 0 && <li className="is-more">+{extra} more</li>}
          </ul>
        )}

        <div className="cc__foot">
          <span className="cc__cta" aria-hidden="true">View programme <ArrowRight size={15} /></span>
          <span className="sr-only">View programme: {course.title}</span>
          <span className="cc__compare"><CompareCourseButton slug={course.slug} /></span>
        </div>
      </div>
    </article>
  )
}
