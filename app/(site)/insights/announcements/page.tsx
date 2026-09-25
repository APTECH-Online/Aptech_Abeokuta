import PageHero from '../../../../components/shared/PageHero'
import ContentTypeListing from '../../../../components/insights/ContentTypeListing'
import { getPublishedInsights, getInsightCategories } from '../../../../lib/insights-public'
import { breadcrumbJsonLd } from '../../../../lib/structured-data'

export const metadata = {
  title: 'Announcements',
  description: 'Important announcements from APTECH Abeokuta.',
  alternates: { canonical: '/insights/announcements' },
  openGraph: {
    title: 'Announcements — APTECH Abeokuta',
    description: 'Important announcements from APTECH Abeokuta.',
    url: '/insights/announcements'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Announcements — APTECH Abeokuta',
    description: 'Important announcements from APTECH Abeokuta.'
  }
}

type Props = { searchParams: Promise<{ category?: string }> }

export default async function AnnouncementsPage({ searchParams }: Props) {
  const { category } = await searchParams
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

  const categories = await getInsightCategories(['announcement'])
  const activeCategory = category && categories.includes(category) ? category : undefined
  const posts = await getPublishedInsights({ contentTypes: ['announcement'], category: activeCategory })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'Announcements' }])
          )
        }}
      />
      <PageHero
        eyebrow="Announcements"
        title="Important announcements"
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
