import PageHero from '../../../../components/shared/PageHero'
import ContentTypeListing from '../../../../components/insights/ContentTypeListing'
import { getPublishedInsights, getInsightCategories } from '../../../../lib/insights-public'
import { breadcrumbJsonLd } from '../../../../lib/structured-data'
import { buildMetadata, getSiteUrl } from '../../../../lib/seo'
import JsonLd from '../../../../components/shared/JsonLd'

export const metadata = buildMetadata({
  title: 'Announcements | APTECH Abeokuta',
  description:
    'Important announcements for students and applicants from APTECH Abeokuta.',
  path: '/insights/announcements'
})

type Props = { searchParams: Promise<{ category?: string }> }

export default async function AnnouncementsPage({ searchParams }: Props) {
  const { category } = await searchParams
  const baseUrl = getSiteUrl()

  const categories = await getInsightCategories(['announcement'])
  const activeCategory = category && categories.includes(category) ? category : undefined
  const posts = await getPublishedInsights({ contentTypes: ['announcement'], category: activeCategory })

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'Announcements' }])} />
      <PageHero
        eyebrow="Announcements"
        title="Announcements from APTECH Abeokuta"
        description="Admissions deadlines, schedule changes, and other important notices from APTECH Abeokuta."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'Announcements' }]}
      />
      <ContentTypeListing
        active="/insights/announcements"
        eyebrow="Announcements"
        categories={categories}
        activeCategory={activeCategory}
        categoryBaseHref="/insights/announcements"
        posts={posts}
        emptyMessage="No announcements right now — check back soon."
      />
    </>
  )
}
