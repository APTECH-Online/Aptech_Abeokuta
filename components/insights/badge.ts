import type { InsightContentType } from '../../types/db'
import { BLOG_CONTENT_TYPES } from '../../lib/insights-public'
import { isEvergreenInsight } from '../../lib/topics'

/**
 * Short, all-caps badge label shown on content cards. News, Announcement
 * and Event keep their own distinct badge; the editorial content types
 * (see BLOG_CONTENT_TYPES) are all badged as INSIGHT since that's how the
 * public site groups them (/insights/blog).
 */
export function badgeLabel(contentType: InsightContentType, category?: string | null): string {
  // The launch guides are stored as content_type 'news' but are evergreen
  // explainers; labelling them NEWS misdescribes them to readers and crawlers.
  if (isEvergreenInsight(category)) return 'GUIDE'
  if (contentType === 'news') return 'NEWS'
  if (contentType === 'announcement') return 'ANNOUNCEMENT'
  if (contentType === 'event') return 'EVENT'
  if (BLOG_CONTENT_TYPES.includes(contentType)) return 'INSIGHT'
  return 'UPDATE'
}

export function badgeColors(contentType: InsightContentType): { bg: string; fg: string } {
  switch (contentType) {
    case 'news':
      return { bg: 'var(--color-navy-100)', fg: 'var(--color-navy-900)' }
    case 'announcement':
      return { bg: 'var(--color-amber-100)', fg: 'var(--color-amber-700)' }
    case 'event':
      return { bg: 'var(--color-teal-100)', fg: 'var(--color-teal-700)' }
    default:
      return { bg: 'var(--color-navy-50)', fg: 'var(--color-navy-900)' }
  }
}

// en-GB gives day/month/year ordering, which reads correctly for a
// Nigerian audience (matches the date formatting already used in
// app/(site)/insights/page.tsx and the [slug] page).
export function formatPublishedDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatEventDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
