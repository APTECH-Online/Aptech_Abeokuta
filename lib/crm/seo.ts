import 'server-only'

import { createAdminClient } from '../supabase/admin'
import { requireStaff, ForbiddenError } from '../auth'
import { hasPermission } from '../permissions'
import {
  STATIC_INDEXABLE_PATHS,
  SEO_TITLE_RECOMMENDED,
  SEO_DESCRIPTION_MAX,
  computeSeoCoverage,
  missingSeoFields
} from '../seo'
import { INSIGHT_CONTENT_TYPE_LABELS, type InsightContentType } from '../../types/db'

export interface SeoMetricIssue {
  type: 'course' | 'insight' | 'redirect'
  title: string
  path: string
  detail: string
}

export interface SeoMetrics {
  generatedAt: string
  score: number
  indexableUrls: number
  staticIndexableUrls: number
  indexableCourses: number
  indexableInsights: number
  publishedCourses: number
  publishedInsights: number
  customMetadataCoverage: number
  customMetadataPages: number
  missingCustomMetadataPages: number
  missingSeoTitlePages: number
  missingSeoDescriptionPages: number
  /** Every record counted in missingCustomMetadataPages, with the field(s) it lacks. */
  missingCustomMetadataRecords: { type: 'course' | 'insight'; title: string; path: string; missing: ('seo_title' | 'seo_description')[] }[]
  noindexContent: number
  redirects: number
  non301Redirects: number
  redirectChainRisks: number
  staleContent: number
  sitemapEligibility: number
  byContentType: { label: string; count: number }[]
  issues: SeoMetricIssue[]
}

/**
 * CRM SEO health metrics are deliberately based on first-party data already
 * managed by the CMS: published courses, published insights, noindex flags,
 * SEO overrides and CRM-managed redirects. Search Console impressions,
 * clicks, CTR and average position are external performance metrics and are
 * not fabricated here; they require a Search Console data connection.
 */
export async function requireSeoMetricsAccess() {
  const staff = await requireStaff()
  if (staff.role === 'super_admin') return staff
  if (hasPermission(staff, 'dashboard_access') && hasPermission(staff, 'dashboard_view_seo_metrics')) return staff
  throw new ForbiddenError()
}

export async function getSeoMetrics(): Promise<SeoMetrics> {
  await requireSeoMetricsAccess()
  const supabase = createAdminClient()

  const [{ data: coursesRaw, error: coursesError }, { data: insightsRaw, error: insightsError }, { data: redirectsRaw, error: redirectsError }] =
    await Promise.all([
      supabase
        .from('courses')
        .select('title, slug, status, seo_title, seo_description, seo_noindex, updated_at')
        .order('updated_at', { ascending: false }),
      supabase
        .from('insights')
        .select('title, slug, content_type, status, seo_title, seo_description, seo_noindex, updated_at')
        .order('updated_at', { ascending: false }),
      supabase
        .from('seo_redirects')
        .select('from_path, to_path, status_code, created_at')
        .order('created_at', { ascending: false })
    ])

  // 42703 = undefined column: migration 0018_seo_fields.sql has not been applied.
  // Say so plainly instead of surfacing an opaque database error.
  for (const error of [coursesError, insightsError]) {
    if (error && (error.code === '42703' || /seo_/.test(error.message ?? ''))) {
      throw new Error('SEO metrics need the SEO columns from migration 0018_seo_fields.sql. Apply it (and 0019_seo_metadata_backfill.sql), then reload.')
    }
  }
  if (coursesError) throw coursesError
  if (insightsError) throw insightsError
  if (redirectsError) throw redirectsError

  const courses = (coursesRaw ?? []) as any[]
  const insights = (insightsRaw ?? []) as any[]
  const redirects = (redirectsRaw ?? []) as any[]

  const publishedCourses = courses.filter((row) => row.status === 'published')
  const publishedInsights = insights.filter((row) => row.status === 'published')
  const indexableCourses = publishedCourses.filter((row) => !row.seo_noindex)
  const indexableInsights = publishedInsights.filter((row) => !row.seo_noindex)

  const cmsContent = [...publishedCourses, ...publishedInsights]
  // Same completeness rule the CRM save actions use (lib/seo.ts): a record is
  // complete only when BOTH a SEO title and a meta description are stored.
  const coverage = computeSeoCoverage([
    ...publishedCourses.map((row) => ({ ...row, kind: 'course' as const })),
    ...publishedInsights.map((row) => ({ ...row, kind: 'insight' as const }))
  ])
  const customMetadataPages = coverage.complete
  const missingCustomMetadataPages = coverage.missing
  const customMetadataCoverage = coverage.total ? Math.round((customMetadataPages / coverage.total) * 100) : 100
  const noindexContent = cmsContent.filter((row) => Boolean(row.seo_noindex)).length

  const non301Redirects = redirects.filter((row) => Number(row.status_code) !== 301).length
  const redirectSources = new Set(redirects.map((row) => row.from_path))
  const redirectChainRisks = redirects.filter((row) => redirectSources.has(row.to_path)).length

  const now = Date.now()
  const staleCutoff = now - 180 * 24 * 60 * 60 * 1000
  const staleContent = cmsContent.filter((row) => {
    const updated = Date.parse(row.updated_at ?? '')
    return Number.isFinite(updated) && updated < staleCutoff
  }).length

  const indexableUrls = STATIC_INDEXABLE_PATHS.length + indexableCourses.length + indexableInsights.length
  const sitemapEligibility = indexableUrls > 0 ? 100 : 0

  const issues: SeoMetricIssue[] = []
  for (const row of cmsContent) {
    const path = row.content_type ? `/insights/${row.slug}` : `/courses/${row.slug}`
    const type = row.content_type ? 'insight' : 'course'
    const missingFields = missingSeoFields(row)
    if (missingFields.length > 0) {
      const what = missingFields.length === 2 ? 'SEO title and meta description' : missingFields[0] === 'seo_title' ? 'SEO title' : 'meta description'
      issues.push({
        type,
        title: row.title,
        path,
        detail: `Missing a custom ${what}. The public page has a generated fallback, but saving the record in the CRM will store one.`
      })
    }
    if (row.seo_title && row.seo_title.length > SEO_TITLE_RECOMMENDED) {
      issues.push({ type, title: row.title, path, detail: `SEO title is ${row.seo_title.length} characters; review for search-result truncation.` })
    }
    if (row.seo_description && row.seo_description.length > SEO_DESCRIPTION_MAX) {
      issues.push({ type, title: row.title, path, detail: `SEO description is ${row.seo_description.length} characters; review for search-result truncation.` })
    }
  }

  for (const row of redirects) {
    if (Number(row.status_code) !== 301) {
      issues.push({ type: 'redirect', title: row.from_path, path: row.from_path, detail: `Redirect uses HTTP ${row.status_code} instead of 301.` })
    }
    if (redirectSources.has(row.to_path)) {
      issues.push({ type: 'redirect', title: row.from_path, path: row.from_path, detail: `Destination ${row.to_path} is itself a redirect source; this can create a redirect chain.` })
    }
  }

  // A health score for the CRM-managed SEO layer, not a Google ranking score.
  // Metadata coverage = 50%, redirect hygiene = 30%, freshness = 20%.
  // Intentional noindex pages are reported separately and are not penalised.
  const metadataScore = cmsContent.length ? customMetadataCoverage : 100
  const redirectScore = redirects.length ? Math.round(((redirects.length - non301Redirects - redirectChainRisks) / redirects.length) * 100) : 100
  const freshnessScore = cmsContent.length ? Math.round(((cmsContent.length - staleContent) / cmsContent.length) * 100) : 100
  const score = Math.max(0, Math.min(100, Math.round(metadataScore * 0.5 + redirectScore * 0.3 + freshnessScore * 0.2)))

  const byTypeCounts = new Map<string, number>()
  for (const row of publishedInsights) {
    const label = INSIGHT_CONTENT_TYPE_LABELS[row.content_type as InsightContentType] ?? row.content_type
    byTypeCounts.set(label, (byTypeCounts.get(label) ?? 0) + 1)
  }

  return {
    generatedAt: new Date().toISOString(),
    score,
    indexableUrls,
    staticIndexableUrls: STATIC_INDEXABLE_PATHS.length,
    indexableCourses: indexableCourses.length,
    indexableInsights: indexableInsights.length,
    publishedCourses: publishedCourses.length,
    publishedInsights: publishedInsights.length,
    customMetadataCoverage,
    customMetadataPages,
    missingCustomMetadataPages,
    missingSeoTitlePages: coverage.missingTitle,
    missingSeoDescriptionPages: coverage.missingDescription,
    missingCustomMetadataRecords: coverage.records.map((r) => ({ type: r.kind, title: r.title, path: r.path, missing: r.missing })),
    noindexContent,
    redirects: redirects.length,
    non301Redirects,
    redirectChainRisks,
    staleContent,
    sitemapEligibility,
    byContentType: Array.from(byTypeCounts.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    issues: issues.slice(0, 40)
  }
}
