'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  Code2,
  Globe2,
  Network,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Timer,
  BarChart3
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Course } from '../../data/courses'

type Interest = 'software' | 'data' | 'cyber' | 'networking' | 'web' | 'business'
type Commitment = 'short' | 'professional' | 'long'

type InterestOption = {
  id: Interest
  label: string
  icon: LucideIcon
  tone: string
}

const INTERESTS: InterestOption[] = [
  { id: 'software', label: 'Software Development', icon: Code2, tone: 'blue' },
  { id: 'data', label: 'Data & AI', icon: BarChart3, tone: 'teal' },
  { id: 'cyber', label: 'Cybersecurity', icon: ShieldCheck, tone: 'violet' },
  { id: 'networking', label: 'Networking', icon: Network, tone: 'amber' },
  { id: 'web', label: 'Web Development', icon: Globe2, tone: 'sky' },
  { id: 'business', label: 'Business / Office Technology', icon: BriefcaseBusiness, tone: 'indigo' }
]

const COMMITMENTS: { id: Commitment; label: string; hint: string }[] = [
  { id: 'short', label: 'Short-term', hint: 'A few weeks, one focused skill' },
  { id: 'professional', label: 'Professional', hint: 'A foundation plus a specialisation' },
  { id: 'long', label: 'Long-term', hint: 'A multi-term diploma pathway' }
]

const RECOMMENDATIONS: Record<Interest, Record<Commitment, string>> = {
  software: { short: 'python-django', professional: 'java-i-ii', long: 'advanced-diploma-software-engineering' },
  data: { short: 'advanced-excel-2019', professional: 'data-mgt-sql-server-2016', long: 'smart-pro' },
  cyber: { short: 'linux', professional: 'windows-server-admin', long: 'aptech-certified-network-specialist' },
  networking: { short: 'linux', professional: 'windows-server-admin', long: 'aptech-certified-network-specialist' },
  web: { short: 'responsive-web-development', professional: 'responsive-web-development', long: 'advanced-diploma-software-engineering' },
  business: { short: 'ms-office-2019-office-automation', professional: 'advanced-excel-2019', long: 'smart-pro' }
}

const toneClass: Record<string, string> = {
  blue: 'program-finder__icon--blue',
  teal: 'program-finder__icon--teal',
  violet: 'program-finder__icon--violet',
  amber: 'program-finder__icon--amber',
  sky: 'program-finder__icon--sky',
  indigo: 'program-finder__icon--indigo'
}

export default function ProgramFinder({ courses }: { courses: Course[] }) {
  const [interest, setInterest] = useState<Interest | null>(null)
  const [commitment, setCommitment] = useState<Commitment | null>(null)

  const recommendedSlug = interest && commitment ? RECOMMENDATIONS[interest][commitment] : null
  const recommended = recommendedSlug ? courses.find((c) => c.slug === recommendedSlug) : null

  function reset() {
    setInterest(null)
    setCommitment(null)
  }

  const step = recommended ? 3 : interest ? 2 : 1

  if (recommended) {
    return (
      <div className="program-finder program-finder--result">
        <div className="program-finder__result-icon" aria-hidden="true"><Check size={22} /></div>
        <p className="eyebrow">Recommended programme</p>
        <h3 className="h-section mt-2" style={{ fontSize: 'clamp(1.5rem, 2.4vw, 2rem)' }}>{recommended.title}</h3>
        <p className="mt-3 leading-relaxed" style={{ color: 'var(--color-body)' }}>{recommended.summary}</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            ['Duration', recommended.duration],
            ['Level', recommended.level],
            ['Category', recommended.category]
          ].map(([label, value]) => (
            <div key={label} className="program-finder__meta">
              <p>{label}</p>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <p className="mt-6 font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>Key skills you&apos;ll build</p>
        <ul className="mt-2 space-y-1.5">
          {recommended.outcomes.slice(0, 3).map((o) => (
            <li key={o} className="text-sm leading-relaxed flex gap-2" style={{ color: 'var(--color-body)' }}>
              <span aria-hidden="true" className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-amber-500)' }} />
              {o}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={`/courses/${recommended.slug}`} className="btn btn-primary inline-flex items-center gap-1.5">
            Explore programme <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <button type="button" onClick={reset} className="btn btn-ghost inline-flex items-center gap-1.5">
            <RotateCcw size={14} aria-hidden="true" /> Start over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="program-finder">
      <div className="program-finder__topline">
        <div className="program-finder__step" aria-hidden="true">{step}</div>
        <div>
          <p className="program-finder__question-label">Question {step} of 2</p>
          <p className="program-finder__question">
            {interest ? 'How much time do you want to commit?' : 'What are you interested in?'}
          </p>
        </div>
      </div>

      <div className="program-finder__progress" aria-hidden="true">
        <span className={step >= 1 ? 'is-active' : ''} />
        <span className={step >= 2 ? 'is-active' : ''} />
      </div>

      {!interest ? (
        <div className="program-finder__options">
          {INTERESTS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setInterest(item.id)}
                className="program-finder__option"
              >
                <span className={`program-finder__icon ${toneClass[item.tone]}`} aria-hidden="true"><Icon size={19} /></span>
                <span className="program-finder__option-copy">{item.label}</span>
                <ArrowRight size={17} className="program-finder__option-arrow" aria-hidden="true" />
              </button>
            )
          })}
        </div>
      ) : (
        <>
          <button type="button" onClick={() => setInterest(null)} className="program-finder__back">
            <ChevronLeft size={15} aria-hidden="true" /> Back to interests
          </button>
          <div className="program-finder__commitments">
            {COMMITMENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCommitment(item.id)}
                className={`program-finder__commitment ${commitment === item.id ? 'is-selected' : ''}`}
                aria-pressed={commitment === item.id}
              >
                <span className="program-finder__commitment-icon" aria-hidden="true"><Timer size={17} /></span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
                {commitment === item.id && <Check size={17} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="program-finder__hint">
        <Sparkles size={15} aria-hidden="true" />
        <span>Your answers help us narrow down the programme that matches your learning goal.</span>
      </div>
    </div>
  )
}
