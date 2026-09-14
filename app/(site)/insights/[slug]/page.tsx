import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Link2, Phone } from 'lucide-react'
import Container from '../../../../components/ui/Container'
import Breadcrumbs from '../../../../components/shared/Breadcrumbs'
import CTABand from '../../../../components/home/CTABand'
import { getInsightBySlug, getRelatedInsights } from '../../../../lib/insights-public'
import { breadcrumbJsonLd, articleJsonLd, eventJsonLd } from '../../../../lib/structured-data'
import { INSIGHT_CONTENT_TYPE_LABELS } from '../../../../types/db'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = await getInsightBySlug(slug)
  if (!post) return { title: 'Not found' }

  const title = post.seo_title || post.title
  const description = post.seo_description || post.short_description || undefined

  return {
    title,
    description,
    alternates: { canonical: `/insights/${post.slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/insights/${post.slug}`,
      ...(post.featured_image ? { images: [post.featured_image] } : {})
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  }
}

export default async function InsightArticlePage({ params }: Props) {
  const { slug } = await params
  const post = await getInsightBySlug(slug)
  if (!post) notFound()

  const related = await getRelatedInsights(post)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
  const isEvent = post.content_type === 'event'
  const articleOrEventJsonLd = isEvent ? await eventJsonLd(baseUrl, post) : articleJsonLd(baseUrl, post)
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleOrEventJsonLd) }}
      />

      <section className="border-b hairline pattern-adire" style={{ background: 'var(--color-navy-900)' }}>
        <div className="container py-12 sm:py-16">
          <Breadcrumbs items={crumbs} />
          <p className="eyebrow eyebrow-inverse mt-5">{post.category} · {INSIGHT_CONTENT_TYPE_LABELS[post.content_type]}</p>
          <h1 className="h-display mt-2 max-w-3xl" style={{ color: '#fff' }}>{post.title}</h1>
          {post.short_description && (
            <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {post.short_description}
            </p>
          )}
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

          {post.featured_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.featured_image}
              alt={post.title}
              className="mt-6 w-full rounded-xl object-cover"
              style={{ aspectRatio: '16 / 9' }}
            />
          )}

          {isEvent && (post.event_start_at || post.event_venue) && (
            <div className="mt-8 card p-5 grid gap-2.5">
              <p className="eyebrow">Event details</p>
              {post.event_start_at && (
                <p className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                  <CalendarDays size={16} aria-hidden="true" style={{ color: 'var(--color-teal-700)' }} />
                  {new Date(post.event_start_at).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}
                  {post.event_end_at && ` — ${new Date(post.event_end_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`}
                </p>
              )}
              {post.event_venue && (
                <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-body)' }}>
                  <MapPin size={16} aria-hidden="true" style={{ color: 'var(--color-teal-700)' }} />
                  {post.event_venue}
                </p>
              )}
              {post.event_registration_url && (
                <a
                  href={post.event_registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: 'var(--color-teal-700)' }}
                >
                  <Link2 size={16} aria-hidden="true" />
                  Register for this event
                </a>
              )}
              {post.event_contact && (
                <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                  <Phone size={16} aria-hidden="true" />
                  {post.event_contact}
                </p>
              )}
            </div>
          )}

          <div className="insight-content mt-8" dangerouslySetInnerHTML={{ __html: post.content }} />

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
                  {r.short_description && (
                    <p className="mt-2 text-xs leading-relaxed flex-1" style={{ color: 'var(--color-muted)' }}>
                      {r.short_description}
                    </p>
                  )}
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
