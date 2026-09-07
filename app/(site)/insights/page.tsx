import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import { insights, insightCategories } from '../../../data/insights'
import { breadcrumbJsonLd } from '../../../lib/structured-data'

export const metadata = {
  title: 'Insights',
  description: 'Career guides, technology explainers and student advice from APTECH Abeokuta.',
  alternates: { canonical: '/insights' },
  openGraph: {
    title: 'Insights — APTECH Abeokuta',
    description: 'Career guides, technology explainers and student advice from APTECH Abeokuta.',
    url: '/insights'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Insights — APTECH Abeokuta',
    description: 'Career guides, technology explainers and student advice from APTECH Abeokuta.'
  }
}

type Props = { searchParams: Promise<{ category?: string }> }

export default async function InsightsPage({ searchParams }: Props) {
  const { category } = await searchParams
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
  const activeCategory = category && insightCategories.includes(category as any) ? category : undefined
  const posts = activeCategory ? insights.filter((p) => p.category === activeCategory) : insights

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Insights' }]))
        }}
      />
      <PageHero
        eyebrow="Insights"
        title="Career guides & technology explainers"
        description="Practical, plain-language guidance on tech careers, learning to code, and choosing the right programme — written for people deciding on their next step."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Insights' }]}
      />

      <section className="section">
        <Container>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
            <Link
              href="/insights"
              className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors"
              style={{
                background: !activeCategory ? 'var(--color-navy-900)' : 'var(--color-navy-50)',
                color: !activeCategory ? '#fff' : 'var(--color-navy-900)'
              }}
            >
              All
            </Link>
            {insightCategories.map((c) => (
              <Link
                key={c}
                href={`/insights?category=${encodeURIComponent(c)}`}
                className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors"
                style={{
                  background: activeCategory === c ? 'var(--color-navy-900)' : 'var(--color-navy-50)',
                  color: activeCategory === c ? '#fff' : 'var(--color-navy-900)'
                }}
              >
                {c}
              </Link>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article key={post.slug} className="card p-6 flex flex-col">
                <p className="eyebrow">{post.category}</p>
                <h2 className="mt-3 font-display font-semibold text-[1.05rem] text-[var(--color-ink)] leading-snug">
                  {post.title}
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed flex-1" style={{ color: 'var(--color-body)' }}>
                  {post.excerpt}
                </p>
                <Link
                  href={`/insights/${post.slug}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: 'var(--color-teal-700)' }}
                >
                  Read article
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>

          {posts.length === 0 && (
            <p className="mt-10 text-sm" style={{ color: 'var(--color-muted)' }}>
              No articles in this category yet — check back soon.
            </p>
          )}
        </Container>
      </section>
    </>
  )
}
