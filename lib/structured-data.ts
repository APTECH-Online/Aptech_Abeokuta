import { siteConfig } from '../data/site'
import type { Course } from '../data/courses'
import { getPublishedSocialLinks } from '../lib/social-links-public'
import { getPublicContactInfo } from '../lib/contact-info-public'
import { BLOG_CONTENT_TYPES, type PublicInsight } from '../lib/insights-public'
import { isEvergreenInsight } from './topics'
import {
  absoluteUrl,
  DEFAULT_OG_IMAGE,
  mapsUrl,
  openingHoursSpecification,
  stripHtml,
  toE164,
  truncate
} from './seo'

/**
 * All JSON-LD for the public site. Rules this module follows:
 *  - Only emit a type when the page genuinely qualifies, and only from data
 *    the visible page also shows (no invented ratings, prices, reviews,
 *    coordinates or hours).
 *  - Every node that other nodes refer to has a stable @id, so Organization
 *    is declared once (site layout) and referenced everywhere else.
 *  - Functions return `null` when a page does not qualify; render them via
 *    <JsonLd/> which skips nulls and escapes unsafe characters.
 */

export const orgId = (baseUrl: string) => `${baseUrl}/#organization`
export const websiteId = (baseUrl: string) => `${baseUrl}/#website`

const orgRef = (baseUrl: string) => ({
  '@type': 'EducationalOrganization',
  '@id': orgId(baseUrl),
  name: siteConfig.name
})

/**
 * Site-wide graph, rendered once in the public layout: the school as an
 * EducationalOrganization + LocalBusiness, and the WebSite it publishes.
 * Contact details come from the CRM's contact_info (single source of truth),
 * so schema, footer, contact page and WhatsApp CTAs can never disagree.
 */
export async function siteGraphJsonLd(baseUrl: string) {
  const [socialLinks, contactInfo] = await Promise.all([getPublishedSocialLinks(), getPublicContactInfo()])
  const hours = openingHoursSpecification(contactInfo.hours)
  const telephone = toE164(contactInfo.phone) ?? contactInfo.phone

  const organization = {
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    '@id': orgId(baseUrl),
    name: siteConfig.name,
    description: siteConfig.description,
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/images/aptech-logo.png'),
      width: 738,
      height: 330
    },
    image: absoluteUrl(DEFAULT_OG_IMAGE.url),
    telephone,
    email: contactInfo.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: contactInfo.address.replace(/,?\s*Abeokuta\s*$/i, ''),
      addressLocality: 'Abeokuta',
      addressRegion: 'Ogun State',
      addressCountry: 'NG'
    },
    hasMap: mapsUrl(contactInfo.address),
    areaServed: { '@type': 'City', name: 'Abeokuta' },
    ...(hours.length > 0 ? { openingHoursSpecification: hours } : {}),
    ...(socialLinks.length > 0 ? { sameAs: socialLinks.map((l) => l.url) } : {})
  }

  const website = {
    '@type': 'WebSite',
    '@id': websiteId(baseUrl),
    url: baseUrl,
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: 'en-NG',
    publisher: { '@id': orgId(baseUrl) }
  }

  return { '@context': 'https://schema.org', '@graph': [organization, website] }
}

/** WebPage-family node for pages that have a more specific type (About, Contact, listings). */
export function webPageJsonLd(
  baseUrl: string,
  page: {
    type: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage'
    path: string
    name: string
    description: string
  }
) {
  return {
    '@context': 'https://schema.org',
    '@type': page.type,
    '@id': `${baseUrl}${page.path}#webpage`,
    url: `${baseUrl}${page.path}`,
    name: page.name,
    description: page.description,
    inLanguage: 'en-NG',
    isPartOf: { '@id': websiteId(baseUrl) },
    about: { '@id': orgId(baseUrl) }
  }
}

/**
 * FAQPage schema from the published FAQs. Returns null when there are none
 * (an empty mainEntity is invalid), and strips any markup from answers so the
 * structured text matches what's visible.
 */
export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  if (!faqs || faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: stripHtml(f.question),
      acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.answer) }
    }))
  }
}

/** BreadcrumbList for a page's crumb trail (same shape as PageHero's `crumbs`). */
export function breadcrumbJsonLd(baseUrl: string, crumbs: { label: string; href?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${baseUrl}${c.href}` } : {})
    }))
  }
}

/**
 * Picks the most specific schema.org article type for an Insight:
 * blog-style content → BlogPosting, news → NewsArticle, otherwise Article.
 */
function articleType(contentType: PublicInsight['content_type'], category?: string | null) {
  // The six launch guides are stored as content_type 'news' (migration 0004) but
  // are evergreen how-to/explainer content, not time-bound reporting, so they
  // must not be marked up as NewsArticle.
  if (isEvergreenInsight(category)) return 'Article'
  if (BLOG_CONTENT_TYPES.includes(contentType)) return 'BlogPosting'
  if (contentType === 'news') return 'NewsArticle'
  return 'Article'
}

/**
 * Article/BlogPosting/NewsArticle for a published Insight, built only from
 * that Insight's own fields. The author is the organisation: the CRM stores
 * an internal staff id, which is deliberately never exposed publicly.
 */
export function articleJsonLd(baseUrl: string, insight: PublicInsight) {
  const url = `${baseUrl}/insights/${insight.slug}`
  const image = insight.featured_image ?? absoluteUrl(DEFAULT_OG_IMAGE.url)
  return {
    '@context': 'https://schema.org',
    '@type': articleType(insight.content_type, insight.category),
    headline: truncate(insight.title, 110),
    description: insight.seo_description || insight.short_description || truncate(stripHtml(insight.content), 200),
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: [image],
    articleSection: insight.category,
    wordCount: stripHtml(insight.content).split(' ').filter(Boolean).length,
    inLanguage: 'en-NG',
    datePublished: insight.publish_at ?? insight.created_at,
    dateModified: insight.updated_at,
    author: orgRef(baseUrl),
    publisher: {
      ...orgRef(baseUrl),
      logo: { '@type': 'ImageObject', url: absoluteUrl('/images/aptech-logo.png') }
    }
  }
}

/**
 * Event schema for a published Event-type Insight. Returns null without a
 * start date (Google requires one). The venue is used as typed by staff; the
 * campus street address is attached only when the venue text itself refers to
 * the campus/APTECH, so events held elsewhere are never given the wrong address.
 */
export async function eventJsonLd(baseUrl: string, insight: PublicInsight) {
  if (!insight.event_start_at) return null
  const contactInfo = await getPublicContactInfo()
  const url = `${baseUrl}/insights/${insight.slug}`
  const venue = insight.event_venue?.trim()
  const atCampus = venue ? /aptech|campus/i.test(venue) : false

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: insight.title,
    description: insight.seo_description || insight.short_description || truncate(stripHtml(insight.content), 200),
    url,
    image: [insight.featured_image ?? absoluteUrl(DEFAULT_OG_IMAGE.url)],
    startDate: insight.event_start_at,
    ...(insight.event_end_at ? { endDate: insight.event_end_at } : {}),
    ...(venue ? { eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode' } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    ...(venue
      ? {
          location: {
            '@type': 'Place',
            name: venue,
            address: atCampus
              ? {
                  '@type': 'PostalAddress',
                  streetAddress: contactInfo.address.replace(/,?\s*Abeokuta\s*$/i, ''),
                  addressLocality: 'Abeokuta',
                  addressRegion: 'Ogun State',
                  addressCountry: 'NG'
                }
              : venue
          }
        }
      : {}),
    organizer: orgRef(baseUrl)
  }
}

/**
 * Course schema for a programme's own page — name, description, provider,
 * level and stated outcomes, all of which the page displays. Deliberately no
 * price, rating or start-date data: none is stored, so none is claimed.
 */
/**
 * ISO 8601 duration for the simple, unambiguous forms stored in the CMS
 * ("1 Month", "4 Months", "2 years"). Anything else ("Foundation (146 hrs) + a
 * 200-hour specialisation", "4 terms · 692 instructional hours") returns null,
 * so schema never states a duration the page does not state in the same terms.
 */
export function isoDuration(text: string): string | null {
  const m = /^\s*(\d{1,2})\s*(month|months|year|years)\s*$/i.exec(text)
  if (!m) return null
  return `P${m[1]}${/^y/i.test(m[2]) ? 'Y' : 'M'}`
}

export function courseJsonLd(baseUrl: string, course: Course) {
  const url = `${baseUrl}/courses/${course.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.summary,
    url,
    inLanguage: 'en',
    educationalLevel: course.level,
    ...(isoDuration(course.duration) ? { timeRequired: isoDuration(course.duration) } : {}),
    // Only when staff wrote it and the page displays it under "Entry requirements".
    ...(course.prerequisites ? { coursePrerequisites: course.prerequisites } : {}),
    ...(course.coverImage ? { image: absoluteUrl(course.coverImage) } : {}),
    ...(course.outcomes.length > 0 ? { teaches: course.outcomes.slice(0, 6) } : {}),
    provider: orgRef(baseUrl)
  }
}
