import { siteConfig } from '../data/site'

import { getPublishedSocialLinks } from '../lib/social-links-public'

/** EducationalOrganization schema, built only from verified siteConfig fields. */
export async function organizationJsonLd(baseUrl: string) {
  const socialLinks = await getPublishedSocialLinks()
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: siteConfig.name,
    description: siteConfig.description,
    url: baseUrl,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address,
      addressLocality: 'Abeokuta',
      addressRegion: 'Ogun State',
      addressCountry: 'NG'
    },
    ...(socialLinks.length > 0 ? { sameAs: socialLinks.map((l) => l.url) } : {})
  }
}

/** FAQPage schema, built from the published faqs passed in (see lib/faqs-public.ts). */
export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer
      }
    }))
  }
}

/** BreadcrumbList schema for a page's crumb trail (matches PageHero's `crumbs` prop shape). */
export function breadcrumbJsonLd(
  baseUrl: string,
  crumbs: { label: string; href?: string }[]
) {
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

/** Article schema for a single published Insight, built only from that insight's own fields. */
export function articleJsonLd(
  baseUrl: string,
  insight: {
    title: string
    short_description: string | null
    slug: string
    featured_image: string | null
    category: string
    created_at: string
    updated_at: string
    publish_at: string | null
  }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: insight.title,
    description: insight.short_description ?? undefined,
    url: `${baseUrl}/insights/${insight.slug}`,
    image: insight.featured_image ? [insight.featured_image] : undefined,
    articleSection: insight.category,
    datePublished: insight.publish_at ?? insight.created_at,
    dateModified: insight.updated_at,
    publisher: {
      '@type': 'EducationalOrganization',
      name: siteConfig.name,
      sameAs: baseUrl
    }
  }
}

/** Event schema for a single published Event-type Insight. */
export function eventJsonLd(
  baseUrl: string,
  insight: {
    title: string
    short_description: string | null
    slug: string
    featured_image: string | null
    event_start_at: string | null
    event_end_at: string | null
    event_venue: string | null
  }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: insight.title,
    description: insight.short_description ?? undefined,
    url: `${baseUrl}/insights/${insight.slug}`,
    image: insight.featured_image ? [insight.featured_image] : undefined,
    startDate: insight.event_start_at ?? undefined,
    endDate: insight.event_end_at ?? undefined,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: insight.event_venue
      ? {
          '@type': 'Place',
          name: insight.event_venue,
          address: siteConfig.address
        }
      : undefined,
    organizer: {
      '@type': 'EducationalOrganization',
      name: siteConfig.name,
      sameAs: baseUrl
    }
  }
}

/** Course schema for a single programme's own page, built only from that course's real data. */
export function courseJsonLd(
  baseUrl: string,
  course: { title: string; description: string; slug: string; duration: string }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    url: `${baseUrl}/courses/${course.slug}`,
    provider: {
      '@type': 'EducationalOrganization',
      name: siteConfig.name,
      sameAs: baseUrl
    }
  }
}
