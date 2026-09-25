import PageHero from '../../../../components/shared/PageHero'
import ContentTypeListing from '../../../../components/insights/ContentTypeListing'
import { getPublishedInsights, getInsightCategories } from '../../../../lib/insights-public'
import { breadcrumbJsonLd } from '../../../../lib/structured-data'

export const metadata = {
  title: 'News',
  description: 'The latest published news from APTECH Abeokuta.',
  alternates: { canonical: '/insights/news' },
  openGraph: {
    title: 'News — APTECH Abeokuta',
    description: 'The latest published news from APTECH Abeokuta.',
    url: '/insights/news'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'News — APTECH Abeokuta',
    description: 'The latest published news from APTECH Abeokuta.'
  }
}

type Props = { searchParams: Promise<{ category?: string }> }

export default async function NewsPage({ searchParams }: Props) {
  const { category } = await searchParams
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

  const categories = await getInsightCategories(['news'])
  const activeCategory = category && categories.includes(category) ? category : undefined
  const posts = await getPublishedInsights({ contentTypes: ['news'], category: activeCategory })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'News' }])
          )
        }}
      />
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
