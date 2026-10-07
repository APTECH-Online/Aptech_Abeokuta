'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GitCompareArrows, X } from 'lucide-react'
import { clearCompareSlugs, COMPARE_MAX, useCompareSlugs } from '../../lib/compare-store'
import { trackConversionEvent } from '../../lib/conversion-events'

/** Floating shortlist bar shown on /courses pages once something is selected. Hidden on the compare page itself. */
export default function CompareTray() {
  const pathname = usePathname()
  const slugs = useCompareSlugs()
  if (!slugs.length || pathname === '/courses/compare') return null

  const ready = slugs.length >= 2
  return (
    <div className="compare-tray" role="region" aria-label="Programme comparison shortlist">
      <span className="compare-tray__count">
        <GitCompareArrows size={16} aria-hidden="true" />
        <span>{slugs.length}/{COMPARE_MAX} selected</span>
      </span>
      {ready ? (
        <Link
          href={`/courses/compare?programmes=${encodeURIComponent(slugs.join(','))}`}
          className="btn btn-primary btn-sm"
          onClick={() => trackConversionEvent('comparison_cta_clicked', { action: 'view_comparison', programmeSlugs: slugs })}
        >
          Compare
        </Link>
      ) : (
        <span className="compare-tray__hint">Pick one more</span>
      )}
      <button type="button" className="compare-tray__clear" onClick={clearCompareSlugs} aria-label="Clear comparison shortlist">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
