import type { MetadataRoute } from 'next'
import { getSiteUrl, RESERVED_INSIGHT_SLUGS, STATIC_INDEXABLE_PATHS } from '../lib/seo'
import { getSitemapCourses } from '../lib/courses-public'
import { getSitemapInsights } from '../lib/insights-public'
import { getPublicChallenges } from '../lib/tech-zone'

/**
 * XML sitemap, served at /sitemap.xml.
 *
 * - Lists only indexable public pages: never /admin, /api or auth routes.
 * - Every URL is the canonical form (absolute, HTTPS origin from
 *   NEXT_PUBLIC_SITE_URL, lowercase slugs, no trailing slash, no query strings).
 * - Courses and insights (news, blog, announcements, events) come straight from
 *   the database, published-only, so drafts, scheduled, archived, expired and
 *   "noindex"-flagged content can never appear.
 * - <lastmod> is only emitted where a real modification date exists (CMS
 *   updated_at). Static pages carry none rather than a fake "now".
 *   changefreq/priority are omitted: Google ignores both.
 *
 * Freshness: regenerated hourly (`revalidate`) AND on demand — the CRM's
 * course/insight actions and the scheduled-publish cron call
 * revalidatePath('/sitemap.xml'), so a newly published page appears right away.
 */
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const [courses, insights, challenges] = await Promise.all([getSitemapCourses(), getSitemapInsights(), getPublicChallenges()])

  const latest = (dates: (string | undefined)[]) => {
    const times = dates.filter(Boolean).map((d) => Date.parse(d as string)).filter((t) => Number.isFinite(t))
    return times.length ? new Date(Math.max(...times)) : undefined
  }

  const listingLastModified: Record<string, Date | undefined> = {
    '/courses': latest(courses.map((c) => c.updatedAt)),
    '/insights': latest(insights.map((i) => i.updatedAt)),
    '/insights/news': latest(insights.filter((i) => i.contentType === 'news').map((i) => i.updatedAt)),
    '/insights/announcements': latest(insights.filter((i) => i.contentType === 'announcement').map((i) => i.updatedAt)),
    '/insights/events': latest(insights.filter((i) => i.contentType === 'event').map((i) => i.updatedAt))
  }

  const staticEntries: MetadataRoute.Sitemap = STATIC_INDEXABLE_PATHS.map((path) => ({
    url: `${base}${path}`, // '/' → `${base}/`, matching the homepage canonical exactly
    ...(listingLastModified[path] ? { lastModified: listingLastModified[path] } : {})
  }))

  const courseEntries: MetadataRoute.Sitemap = courses.map((c) => ({
    url: `${base}/courses/${c.slug}`,
    ...(c.updatedAt ? { lastModified: new Date(c.updatedAt) } : {})
  }))

  const challengeEntries: MetadataRoute.Sitemap = challenges.map((c) => ({ url: `${base}/tech-zone/${c.slug}` }))

  const insightEntries: MetadataRoute.Sitemap = insights
    .filter((i) => !RESERVED_INSIGHT_SLUGS.includes(i.slug))
    .map((i) => ({ url: `${base}/insights/${i.slug}`, lastModified: new Date(i.updatedAt) }))

  return [...staticEntries, ...courseEntries, ...challengeEntries, ...insightEntries]
}
