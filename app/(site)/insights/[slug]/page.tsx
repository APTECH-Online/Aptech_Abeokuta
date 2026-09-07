import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Container from '../../../../components/ui/Container'
import Breadcrumbs from '../../../../components/shared/Breadcrumbs'
import CTABand from '../../../../components/home/CTABand'
import { insights, getInsightBySlug, getRelatedInsights } from '../../../../data/insights'
import { breadcrumbJsonLd } from '../../../../lib/structured-data'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return insights.map((i) => ({ slug: i.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = getInsightBySlug(slug)
  if (!post) return { title: 'Article not found' }
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/insights/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `/insights/${post.slug}`
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt
    }
  }
}

export default async function InsightArticlePage({ params }: Props) {
  const { slug } = await params
  const post = getInsightBySlug(slug)
  if (!post) notFound()

  const related = getRelatedInsights(post)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Insights', href: '/insights' },
    { label: post.title }
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(baseUrl, crumbs)) }}
      />
      <section className="border-b hairline pattern-adire" style={{ background: 'var(--color-navy-900)' }}>
        <div className="container py-12 sm:py-16">
          <Breadcrumbs items={crumbs} />
          <p className="eyebrow eyebrow-inverse mt-5">{post.category}</p>
          <h1 className="h-display mt-2 max-w-3xl" style={{ color: '#fff' }}>{post.title}</h1>
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {post.excerpt}
          </p>
        </div>
      </section>

      <section className="section">
        <Container className="max-w-2xl">
          <Link
            href="/insights"
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: 'var(--color-teal-700)' }}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to Insights
          </Link>

          <div className="mt-8 space-y-5">
            {post.body.map((paragraph, i) => (
              <p key={i} className="leading-relaxed text-[1.02rem]" style={{ color: 'var(--color-body)' }}>
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-10 pt-8" style={{ borderTop: '1px solid var(--color-line)' }}>
            <CTABand />
          </div>
        </Container>
      </section>

      {related.length > 0 && (
        <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)' }}>
          <Container>
            <p className="eyebrow">More in {post.category}</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((r) => (
                <article key={r.slug} className="card p-5 flex flex-col">
                  <h3 className="font-display font-semibold text-sm text-[var(--color-ink)] leading-snug">{r.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed flex-1" style={{ color: 'var(--color-muted)' }}>
                    {r.excerpt}
                  </p>
                  <Link
                    href={`/insights/${r.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: 'var(--color-teal-700)' }}
                  >
                    Read article
                    <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  )
}
