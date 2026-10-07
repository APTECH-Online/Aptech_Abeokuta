'use client'

import { Check, GitCompareArrows } from 'lucide-react'
import { addCompareSlug, COMPARE_MAX, removeCompareSlug, useCompareSlugs } from '../../lib/compare-store'
import { trackConversionEvent } from '../../lib/conversion-events'

/**
 * Adds/removes a programme from the shared comparison shortlist (see
 * lib/compare-store.ts). The floating CompareTray then links to
 * /courses/compare. Existing ?add=<slug> links to the compare page still work.
 */
export default function CompareCourseButton({ slug, label = 'Compare' }: { slug: string; label?: string }) {
  const selected = useCompareSlugs()
  const isSelected = selected.includes(slug)
  const isFull = !isSelected && selected.length >= COMPARE_MAX
  const subject = label === 'Compare' ? 'this programme' : label

  function onClick() {
    if (isSelected) {
      removeCompareSlug(slug)
      trackConversionEvent('comparison_programme_removed', { programmeSlug: slug, from: 'programme_button' })
    } else if (addCompareSlug(slug)) {
      trackConversionEvent('comparison_programme_added', { programmeSlug: slug, from: 'programme_button' })
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isFull}
      aria-pressed={isSelected}
      aria-label={isSelected ? `Remove ${subject} from comparison` : isFull ? `Comparison is full (${COMPARE_MAX} programmes). Remove one to add ${subject}` : `Add ${subject} to comparison`}
      title={isFull ? `You can compare up to ${COMPARE_MAX} programmes` : undefined}
      className="text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ color: 'var(--color-teal-700)', background: 'none', border: 0, padding: 0, cursor: isFull ? 'not-allowed' : 'pointer' }}
    >
      {isSelected ? <Check size={15} aria-hidden="true" /> : <GitCompareArrows size={15} aria-hidden="true" />}
      {isSelected ? 'Added to compare' : label}
    </button>
  )
}
