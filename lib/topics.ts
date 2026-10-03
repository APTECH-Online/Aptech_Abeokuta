/**
 * Topical structure of the public catalogue, in code.
 *
 * Why this exists: the CMS stores courses and insights as independent rows,
 * so nothing in the database says "this article is about the same subject as
 * that course". This file is that missing editorial layer. It drives:
 *   - Course → related Courses   (replaces "first 3 courses in DB order")
 *   - Course → relevant Insights (new)
 *   - Insight → relevant Courses (new)
 *   - Insight → related Insights (topical, before same-category fallback)
 *   - the descriptive H1 used on each course page
 *
 * Rules:
 *   - Only slugs that exist in the catalogue belong here. Every lookup is
 *     filtered against what is actually published, so a draft, archived or
 *     renamed slug simply disappears from the page; it can never 404 a link.
 *   - Nothing here is displayed as a claim. It only chooses WHICH real,
 *     published pages to link to.
 *   - If staff rename a slug in the CRM, update the slug here too (the old
 *     URL keeps redirecting via seo_redirects, but the link would go through
 *     that redirect until this file is updated).
 */

export type TopicId = 'software' | 'data' | 'networking' | 'office' | 'design'

export const TOPICS: Record<TopicId, { label: string; courses: string[]; insights: string[] }> = {
  software: {
    label: 'Software development',
    courses: ['advanced-diploma-software-engineering', 'responsive-web-development', 'python-django', 'java-i-ii'],
    insights: ['how-to-become-a-software-developer-in-nigeria', 'study-tips-for-learning-to-code']
  },
  data: {
    label: 'Data, analytics and AI',
    courses: ['smart-pro', 'advanced-excel-2019', 'data-mgt-sql-server-2016'],
    insights: ['data-analytics-vs-data-science']
  },
  networking: {
    label: 'Networking, systems and security',
    courses: ['aptech-certified-network-specialist', 'linux', 'windows-server-admin'],
    insights: ['what-is-cybersecurity-and-why-it-matters']
  },
  office: {
    label: 'Office productivity',
    courses: ['ms-office-2019-office-automation', 'advanced-excel-2019'],
    insights: ['it-skills-students-should-learn']
  },
  design: {
    label: 'Design',
    courses: ['graphics-design'],
    // Intentionally empty: there is no design article yet (see the content-gap
    // list in SEO_FINAL_REPORT.md).
    insights: []
  }
}

type CourseTopic = {
  /** Descriptive, search-matching H1 (the card/list title stays the CMS title). */
  h1: string
  /** Hand-picked related courses, most relevant first. */
  relatedCourses: string[]
  /** Insight slugs that genuinely help someone considering this course. */
  relatedInsights: string[]
}

export const COURSE_TOPICS: Record<string, CourseTopic> = {
  'advanced-diploma-software-engineering': {
    h1: 'Advanced Diploma in Software Engineering in Abeokuta',
    relatedCourses: ['responsive-web-development', 'java-i-ii', 'smart-pro'],
    relatedInsights: [
      'how-to-become-a-software-developer-in-nigeria',
      'choosing-between-short-course-and-diploma',
      'study-tips-for-learning-to-code'
    ]
  },
  'smart-pro': {
    h1: 'Smart Pro Programme: Data Science, AI & Software Testing',
    relatedCourses: ['advanced-excel-2019', 'data-mgt-sql-server-2016', 'python-django'],
    relatedInsights: ['data-analytics-vs-data-science', 'choosing-between-short-course-and-diploma']
  },
  'aptech-certified-network-specialist': {
    h1: 'Aptech Certified Network Specialist (ACNS): Networking & Cybersecurity Programme',
    relatedCourses: ['linux', 'windows-server-admin'],
    relatedInsights: ['what-is-cybersecurity-and-why-it-matters', 'choosing-between-short-course-and-diploma']
  },
  'ms-office-2019-office-automation': {
    h1: 'MS Office 2019 Training in Abeokuta',
    relatedCourses: ['advanced-excel-2019'],
    relatedInsights: ['it-skills-students-should-learn', 'choosing-between-short-course-and-diploma']
  },
  'responsive-web-development': {
    h1: 'Responsive Web Development Course in Abeokuta',
    relatedCourses: ['python-django', 'advanced-diploma-software-engineering', 'graphics-design'],
    relatedInsights: ['how-to-become-a-software-developer-in-nigeria', 'study-tips-for-learning-to-code']
  },
  'advanced-excel-2019': {
    h1: 'Advanced Excel 2019 Course in Abeokuta',
    relatedCourses: ['ms-office-2019-office-automation', 'data-mgt-sql-server-2016', 'smart-pro'],
    relatedInsights: ['data-analytics-vs-data-science', 'it-skills-students-should-learn']
  },
  'graphics-design': {
    h1: 'Graphics Design Course in Abeokuta',
    relatedCourses: ['responsive-web-development', 'ms-office-2019-office-automation'],
    relatedInsights: ['choosing-between-short-course-and-diploma']
  },
  linux: {
    h1: 'Linux Course in Abeokuta',
    relatedCourses: ['aptech-certified-network-specialist', 'windows-server-admin', 'python-django'],
    relatedInsights: ['what-is-cybersecurity-and-why-it-matters', 'it-skills-students-should-learn']
  },
  'python-django': {
    h1: 'Python (Django) Course in Abeokuta',
    relatedCourses: ['data-mgt-sql-server-2016', 'responsive-web-development', 'java-i-ii'],
    relatedInsights: ['how-to-become-a-software-developer-in-nigeria', 'study-tips-for-learning-to-code']
  },
  'java-i-ii': {
    h1: 'Java I & II Course in Abeokuta',
    relatedCourses: ['python-django', 'advanced-diploma-software-engineering', 'data-mgt-sql-server-2016'],
    relatedInsights: ['how-to-become-a-software-developer-in-nigeria', 'study-tips-for-learning-to-code']
  },
  'windows-server-admin': {
    h1: 'Windows Server Admin Course in Abeokuta',
    relatedCourses: ['aptech-certified-network-specialist', 'linux'],
    relatedInsights: ['what-is-cybersecurity-and-why-it-matters', 'it-skills-students-should-learn']
  },
  'data-mgt-sql-server-2016': {
    h1: 'SQL Server 2016 Data Management Course in Abeokuta',
    relatedCourses: ['python-django', 'advanced-excel-2019', 'smart-pro'],
    relatedInsights: ['data-analytics-vs-data-science', 'it-skills-students-should-learn']
  }
}

type InsightTopic = {
  /** Courses a reader of this article is most likely to want next. */
  relatedCourses: string[]
  /** Other articles that continue the same line of thought. */
  relatedInsights: string[]
}

export const INSIGHT_TOPICS: Record<string, InsightTopic> = {
  'how-to-become-a-software-developer-in-nigeria': {
    relatedCourses: ['advanced-diploma-software-engineering', 'responsive-web-development', 'python-django'],
    relatedInsights: ['study-tips-for-learning-to-code', 'it-skills-students-should-learn', 'choosing-between-short-course-and-diploma']
  },
  'it-skills-students-should-learn': {
    relatedCourses: ['linux', 'data-mgt-sql-server-2016', 'advanced-excel-2019'],
    relatedInsights: ['how-to-become-a-software-developer-in-nigeria', 'data-analytics-vs-data-science', 'what-is-cybersecurity-and-why-it-matters']
  },
  'what-is-cybersecurity-and-why-it-matters': {
    relatedCourses: ['aptech-certified-network-specialist', 'linux', 'windows-server-admin'],
    relatedInsights: ['it-skills-students-should-learn', 'choosing-between-short-course-and-diploma']
  },
  'data-analytics-vs-data-science': {
    relatedCourses: ['smart-pro', 'advanced-excel-2019', 'data-mgt-sql-server-2016'],
    relatedInsights: ['it-skills-students-should-learn', 'choosing-between-short-course-and-diploma']
  },
  'study-tips-for-learning-to-code': {
    relatedCourses: ['java-i-ii', 'python-django', 'responsive-web-development'],
    relatedInsights: ['how-to-become-a-software-developer-in-nigeria', 'choosing-between-short-course-and-diploma']
  },
  'choosing-between-short-course-and-diploma': {
    relatedCourses: ['advanced-diploma-software-engineering', 'aptech-certified-network-specialist', 'advanced-excel-2019'],
    relatedInsights: ['how-to-become-a-software-developer-in-nigeria', 'study-tips-for-learning-to-code']
  }
}

/** Descriptive H1 for a course page; falls back to the CMS title when the course has no entry. */
export function courseH1(slug: string, title: string): string {
  return COURSE_TOPICS[slug]?.h1 ?? title
}

/**
 * Categories whose articles are evergreen guides, not time-bound reports.
 * The six seeded guides were stored with content_type = 'news' (migration 0004),
 * which would otherwise make their structured data a NewsArticle.
 */
export const EVERGREEN_INSIGHT_CATEGORIES = ['Career Guides', 'Technology', 'Student Guides']

/**
 * Orders `all` so that hand-picked slugs come first (in the order given),
 * then fills up to `limit` from the same category, then from anything else.
 * Unpublished/unknown slugs are skipped automatically because only items in
 * `all` can be returned.
 */
export function pickRelated<T extends { slug: string }>(
  all: T[],
  picked: string[],
  limit: number,
  fallback: (item: T) => boolean = () => false
): T[] {
  const bySlug = new Map(all.map((item) => [item.slug, item]))
  const out: T[] = []
  const seen = new Set<string>()
  const add = (item: T | undefined) => {
    if (item && !seen.has(item.slug) && out.length < limit) {
      seen.add(item.slug)
      out.push(item)
    }
  }
  picked.forEach((slug) => add(bySlug.get(slug)))
  all.filter(fallback).forEach(add)
  return out
}

/** True for the evergreen guides that were stored with content_type = 'news'. */
export function isEvergreenInsight(category: string | null | undefined): boolean {
  return !!category && EVERGREEN_INSIGHT_CATEGORIES.includes(category)
}
