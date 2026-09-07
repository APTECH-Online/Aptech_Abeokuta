'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { courses } from '../../data/courses'

type Interest = 'software' | 'data' | 'cyber' | 'networking' | 'web' | 'business'
type Commitment = 'short' | 'professional' | 'long'

const INTERESTS: { id: Interest; label: string }[] = [
  { id: 'software', label: 'Software Development' },
  { id: 'data', label: 'Data & AI' },
  { id: 'cyber', label: 'Cybersecurity' },
  { id: 'networking', label: 'Networking' },
  { id: 'web', label: 'Web Development' },
  { id: 'business', label: 'Business / Office Technology' }
]

const COMMITMENTS: { id: Commitment; label: string; hint: string }[] = [
  { id: 'short', label: 'Short-term', hint: 'A few weeks, one focused skill' },
  { id: 'professional', label: 'Professional', hint: 'A foundation plus a specialisation' },
  { id: 'long', label: 'Long-term', hint: 'A multi-term diploma pathway' }
]

// Maps each interest + time commitment to a real course slug already in
// data/courses.ts. Where no exact short course exists for a combination,
// this falls back to the closest real course rather than inventing one.
const RECOMMENDATIONS: Record<Interest, Record<Commitment, string>> = {
  software: {
    short: 'python-django',
    professional: 'java-i-ii',
    long: 'advanced-diploma-software-engineering'
  },
  data: {
    short: 'advanced-excel-2019',
    professional: 'data-mgt-sql-server-2016',
    long: 'smart-pro'
  },
  cyber: {
    short: 'linux',
    professional: 'windows-server-admin',
    long: 'aptech-certified-network-specialist'
  },
  networking: {
    short: 'linux',
    professional: 'windows-server-admin',
    long: 'aptech-certified-network-specialist'
  },
  web: {
    short: 'responsive-web-development',
    professional: 'responsive-web-development',
    long: 'advanced-diploma-software-engineering'
  },
  business: {
    short: 'ms-office-2019-office-automation',
    professional: 'advanced-excel-2019',
    long: 'smart-pro'
  }
}

export default function ProgramFinder() {
  const [interest, setInterest] = useState<Interest | null>(null)
  const [commitment, setCommitment] = useState<Commitment | null>(null)

  const recommendedSlug = interest && commitment ? RECOMMENDATIONS[interest][commitment] : null
  const recommended = recommendedSlug ? courses.find((c) => c.slug === recommendedSlug) : null

  function reset() {
    setInterest(null)
    setCommitment(null)
  }

  if (recommended) {
    return (
      <div className="card p-7 sm:p-9">
        <p className="eyebrow">Recommended programme</p>
        <h3 className="mt-2 h-section" style={{ fontSize: '1.5rem' }}>{recommended.title}</h3>
        <p className="mt-3 leading-relaxed" style={{ color: 'var(--color-body)' }}>{recommended.summary}</p>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-muted)' }}>Duration</p>
            <p className="mt-0.5" style={{ color: 'var(--color-ink)' }}>{recommended.duration}</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-muted)' }}>Level</p>
            <p className="mt-0.5" style={{ color: 'var(--color-ink)' }}>{recommended.level}</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-muted)' }}>Category</p>
            <p className="mt-0.5" style={{ color: 'var(--color-ink)' }}>{recommended.category}</p>
          </div>
        </div>

        <p className="mt-5 font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>Key skills you&apos;ll build</p>
        <ul className="mt-2 space-y-1.5">
          {recommended.outcomes.slice(0, 3).map((o) => (
            <li key={o} className="text-sm leading-relaxed flex gap-2" style={{ color: 'var(--color-body)' }}>
              <span aria-hidden="true" className="mt-2 w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--color-amber-500)' }} />
              {o}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/courses/${recommended.slug}`} className="btn btn-primary inline-flex items-center gap-1.5">
            Explore programme
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <button type="button" onClick={reset} className="btn btn-ghost inline-flex items-center gap-1.5">
            <RotateCcw size={14} aria-hidden="true" />
            Start over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-7 sm:p-9">
      {!interest ? (
        <>
          <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>What are you interested in?</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INTERESTS.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => setInterest(i.id)}
                className="text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                style={{ border: '1px solid var(--color-line)', color: 'var(--color-ink)' }}
              >
                {i.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setInterest(null)}
            className="text-xs font-semibold mb-4"
            style={{ color: 'var(--color-muted)' }}
          >
            &larr; Back
          </button>
          <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>How much time do you want to commit?</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {COMMITMENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCommitment(c.id)}
                className="text-left px-4 py-3 rounded-lg transition-colors"
                style={{ border: '1px solid var(--color-line)' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{c.label}</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>{c.hint}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
