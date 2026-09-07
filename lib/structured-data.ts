import { siteConfig, faqs } from '../data/site'

/** EducationalOrganization schema, built only from verified siteConfig fields. */
export function organizationJsonLd(baseUrl: string) {
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
    ...(siteConfig.social.facebook ? { sameAs: [siteConfig.social.facebook] } : {})
  }
}

/** FAQPage schema, built only from the real, existing faqs array in data/site.ts. */
export function faqJsonLd() {
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
