import Link from 'next/link'
import { ArrowRight, Compass, FileText, GraduationCap, Users, type LucideIcon } from 'lucide-react'
import { admissionsSteps } from '../../data/site'

const ICONS: Record<string, LucideIcon> = {
  compass: Compass,
  file: FileText,
  users: Users,
  graduation: GraduationCap
}

export default function ApplySteps() {
  return (
    <ol className="apply-steps" aria-label="How to apply, in four steps">
      {admissionsSteps.map((s, i) => {
        const Icon = ICONS[s.icon] ?? Compass
        const isLast = i === admissionsSteps.length - 1
        return (
          <li key={s.step} className={`apply-step${isLast ? ' is-last' : ''}`}>
            <div className="apply-step__rail" aria-hidden="true">
              <span className="apply-step__num">{s.step}</span>
            </div>
            <div className="apply-step__card">
              <div className="apply-step__top">
                <span className="apply-step__icon" aria-hidden="true"><Icon size={22} strokeWidth={1.9} /></span>
                <span className="apply-step__label">Step {s.step} of {admissionsSteps.length}</span>
              </div>
              <h3 className="apply-step__title">{s.title}</h3>
              <p className="apply-step__body">{s.body}</p>
              {s.cta && (
                <Link href={s.cta.href} className="apply-step__cta">
                  {s.cta.label} <ArrowRight size={15} aria-hidden="true" />
                </Link>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
