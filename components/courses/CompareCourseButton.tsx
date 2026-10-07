'use client'

import Link from 'next/link'
import { GitCompareArrows } from 'lucide-react'

export default function CompareCourseButton({ slug, label = 'Compare' }: { slug: string; label?: string }) {
  return (
    <Link
      href={`/courses/compare?add=${encodeURIComponent(slug)}`}
      className="text-sm font-semibold inline-flex items-center gap-1.5"
      style={{ color: 'var(--color-teal-700)' }}
      aria-label={`Compare ${label === 'Compare' ? 'this programme' : label}`}
    >
      <GitCompareArrows size={15} aria-hidden="true" />
      {label}
    </Link>
  )
}
