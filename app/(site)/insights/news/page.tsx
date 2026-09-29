import PageHero from '../../../../components/shared/PageHero'
import ContentTypeListing from '../../../../components/insights/ContentTypeListing'
import { getPublishedInsights, getInsightCategories } from '../../../../lib/insights-public'
import { breadcrumbJsonLd } from '../../../../lib/structured-data'
import { buildMetadata, getSiteUrl } from '../../../../lib/seo'
import JsonLd from '../../../../components/shared/JsonLd'

export const metadata = buildMetadata({
  title: 'Latest News | APTECH Abeokuta',
  description:
    'Read the latest published news from APTECH Abeokuta, an IT training centre in Abeokuta, Ogun State.',
  path: '/insights/news'
})

type Props = { searchParams: Promise<{ category?: string }> }

export default async function NewsPage({ searchParams }: Props) {
  const { category } = await searchParams
  const baseUrl = getSiteUrl()

  const categories = await getInsightCategories(['news'])
  const activeCategory = category && categories.includes(category) ? category : undefined
  const posts = await getPublishedInsights({ contentTypes: ['news'], category: activeCategory })

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'News' }])} />
      <PageHero
        eyebrow="News"
        title="Latest news from APTECH Abeokuta"
        description="Announcements, milestones, and campus news, published as they happen."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'News' }]}
      />
      <ContentTypeListing
        active="/insights/news"
        eyebrow="News"
        categories={categories}
        activeCategory={activeCategory}
        categoryBaseHref="/insights/news"
        posts={posts}
        emptyMessage="No news published yet — check back soon."
      />
    </>
  )
}
