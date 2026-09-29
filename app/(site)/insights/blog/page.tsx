import PageHero from '../../../../components/shared/PageHero'
import ContentTypeListing from '../../../../components/insights/ContentTypeListing'
import { getPublishedInsights, getInsightCategories, BLOG_CONTENT_TYPES } from '../../../../lib/insights-public'
import { breadcrumbJsonLd } from '../../../../lib/structured-data'
import { buildMetadata, getSiteUrl } from '../../../../lib/seo'
import JsonLd from '../../../../components/shared/JsonLd'

export const metadata = buildMetadata({
  title: 'Career Guides & Tech Insights | APTECH Abeokuta Blog',
  description:
    'Career guides, student and alumni spotlights, academic updates and technology explainers from APTECH Abeokuta.',
  path: '/insights/blog'
})

type Props = { searchParams: Promise<{ category?: string }> }

export default async function BlogPage({ searchParams }: Props) {
  const { category } = await searchParams
  const baseUrl = getSiteUrl()

  const categories = await getInsightCategories(BLOG_CONTENT_TYPES)
  const activeCategory = category && categories.includes(category) ? category : undefined
  const posts = await getPublishedInsights({ contentTypes: BLOG_CONTENT_TYPES, category: activeCategory })

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'Blog / Insights' }])} />
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
