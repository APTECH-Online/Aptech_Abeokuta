import PageHero from '../../../../components/shared/PageHero'
import ContentTypeListing from '../../../../components/insights/ContentTypeListing'
import { getPublishedInsights, getInsightCategories, BLOG_CONTENT_TYPES } from '../../../../lib/insights-public'
import { breadcrumbJsonLd } from '../../../../lib/structured-data'

export const metadata = {
  title: 'Blog / Insights',
  description: 'Career guides, student spotlights, and technology explainers from APTECH Abeokuta.',
  alternates: { canonical: '/insights/blog' },
  openGraph: {
    title: 'Blog / Insights — APTECH Abeokuta',
    description: 'Career guides, student spotlights, and technology explainers from APTECH Abeokuta.',
    url: '/insights/blog'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog / Insights — APTECH Abeokuta',
    description: 'Career guides, student spotlights, and technology explainers from APTECH Abeokuta.'
  }
}

type Props = { searchParams: Promise<{ category?: string }> }

export default async function BlogPage({ searchParams }: Props) {
  const { category } = await searchParams
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

  const categories = await getInsightCategories(BLOG_CONTENT_TYPES)
  const activeCategory = category && categories.includes(category) ? category : undefined
  const posts = await getPublishedInsights({ contentTypes: BLOG_CONTENT_TYPES, category: activeCategory })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'Blog / Insights' }])
          )
        }}
      />
      <PageHero
        eyebrow="Blog / Insights"
        title="Career guides & campus stories"
        description="Practical guidance on tech careers, student and alumni spotlights, and academic updates from APTECH Abeokuta."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'Blog / Insights' }]}
      />
      <ContentTypeListing
        active="/insights/blog"
        eyebrow="Insights"
        categories={categories}
        activeCategory={activeCategory}
        categoryBaseHref="/insights/blog"
        posts={posts}
        emptyMessage="No blog or insight posts published yet — check back soon."
      />
    </>
  )
}
