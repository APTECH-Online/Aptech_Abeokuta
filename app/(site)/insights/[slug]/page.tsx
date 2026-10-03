import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, MapPin, Link2, Phone } from 'lucide-react'
import Container from '../../../../components/ui/Container'
import Breadcrumbs from '../../../../components/shared/Breadcrumbs'
import CTABand from '../../../../components/home/CTABand'
import { getInsightBySlug, getRelatedInsights } from '../../../../lib/insights-public'
import { breadcrumbJsonLd, articleJsonLd, eventJsonLd } from '../../../../lib/structured-data'
import { INSIGHT_CONTENT_TYPE_LABELS } from '../../../../types/db'
import { buildMetadata, getSiteUrl, pickTitle, stripHtml, truncate } from '../../../../lib/seo'
import { findSlugRedirect } from '../../../../lib/seo-redirects'
import { getPublishedCourses } from '../../../../lib/courses-public'
import { INSIGHT_TOPICS, isEvergreenInsight, pickRelated } from '../../../../lib/topics'
import { formatPublishedDate } from '../../../../components/insights/badge'
import { siteConfig } from '../../../../data/site'
import JsonLd from '../../../../components/shared/JsonLd'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getInsightBySlug(slug)
  if (!post) return { title: 'Not found', robots: { index: false, follow: false } }

  const title = post.seo_title || pickTitle([`${post.title} | ${siteConfig.name}`, post.title])
  const description =
    post.seo_description || post.short_description || truncate(stripHtml(post.content), 158)

  return buildMetadata({
    title,
    description,
    path: `/insights/${post.slug}`,
    image: post.featured_image,
    imageAlt: post.title,
    type: 'article',
    publishedTime: post.publish_at ?? post.created_at,
    modifiedTime: post.updated_at,
    section: post.category,
    noindex: post.seo_noindex
  })
}

export default async function InsightArticlePage({ params }: Props) {
  const { slug } = await params
  const post = await getInsightBySlug(slug)
  if (!post) {
    // Slug was renamed in the CRM → permanent redirect to the new URL; otherwise a real 404.
    const target = await findSlugRedirect('/insights', slug)
    if (target) permanentRedirect(target)
    notFound()
  }

  const [related, allCourses] = await Promise.all([getRelatedInsights(post), getPublishedCourses()])
  // Courses a reader of this article is most likely to want next:
  //   1. courses whose CRM "Related guides" list includes this article (so a new
  //      course appears here the moment staff link it, with no code change), then
  //   2. the in-code editorial map (lib/topics.ts) for guides not yet linked from a course.
  // Only published courses are ever in `allCourses`, so a link can never 404.
  const fromCourses = allCourses.filter((c) => c.controlsLoaded && c.relatedInsights.includes(post.slug)).map((c) => c.slug)
  const mapped = INSIGHT_TOPICS[post.slug]?.relatedCourses ?? []
  const wanted = Array.from(new Set([...fromCourses, ...mapped]))
  // Up to five, so a course staff link to a guide in the CRM reliably appears even
  // when several flagship courses already point at the same guide.
  const relatedCourses = pickRelated(allCourses, wanted, 5).filter((c) => wanted.includes(c.slug))
  const evergreen = isEvergreenInsight(post.category)
  const published = formatPublishedDate(post.publish_at ?? post.created_at)
  const updated = formatPublishedDate(post.updated_at)
  const baseUrl = getSiteUrl()
  const isEvent = post.content_type === 'event'
  const articleOrEventJsonLd = isEvent ? await eventJsonLd(baseUrl, post) : articleJsonLd(baseUrl, post)
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Insights', href: '/insights' },
    { label: post.title }
  ]

  return (
    <>
      {/* articleOrEventJsonLd is null for an Event without a start date (schema would be invalid) */}
      <JsonLd data={[breadcrumbJsonLd(baseUrl, crumbs), articleOrEventJsonLd]} />

      <section className="border-b hairline pattern-adire" style={{ background: 'var(--color-navy-900)' }}>
        <div className="container py-12 sm:py-16">
          <Breadcrumbs items={crumbs} />
          <p className="eyebrow eyebrow-inverse mt-5">{post.category} · {evergreen ? 'Guide' : INSIGHT_CONTENT_TYPE_LABELS[post.content_type]}</p>
          <h1 className="h-display mt-2 max-w-3xl" style={{ color: '#fff' }}>{post.title}</h1>
          {post.short_description && (
            <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {post.short_description}
            </p>
          )}
          <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
            By {siteConfig.name}
            {published && <> · Published <time dateTime={post.publish_at ?? post.created_at}>{published}</time></>}
            {updated && updated !== published && <> · Updated <time dateTime={post.updated_at}>{updated}</time></>}
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

          {post.featured_image && (
            <div className="relative mt-6 w-full overflow-hidden rounded-xl" style={{ aspectRatio: '16 / 9' }}>
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 672px) 100vw, 672px"
                className="object-cover"
              />
            </div>
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

          {relatedCourses.length > 0 && (
            <aside className="mt-10 card p-6" aria-labelledby="related-courses-heading">
              <h2 id="related-courses-heading" className="font-display font-semibold text-[1.05rem] text-[var(--color-ink)]">
                Courses at {siteConfig.name} related to this guide
              </h2>
              <ul className="mt-4 space-y-3">
                {relatedCourses.map((c) => (
                  <li key={c.slug} className="text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                    <Link href={`/courses/${c.slug}`} className="font-semibold underline" style={{ color: 'var(--color-teal-700)' }}>
                      {c.title}
                    </Link>
                    <span style={{ color: 'var(--color-muted)' }}> · {c.duration} · {c.level}</span>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <div className="mt-10 pt-8" style={{ borderTop: '1px solid var(--color-line)' }}>
            <CTABand />
          </div>
        </Container>
      </section>

      {related.length > 0 && (
        <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)' }}>
          <Container>
            <h2 className="h-section">Keep reading</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((r) => (
                <article key={r.slug} className="card p-5 flex flex-col">
                  <h3 className="font-display font-semibold text-sm text-[var(--color-ink)] leading-snug">
                    <Link href={`/insights/${r.slug}`} className="hover:underline">{r.title}</Link>
                  </h3>
                  {r.short_description && (
                    <p className="mt-2 text-xs leading-relaxed flex-1" style={{ color: 'var(--color-muted)' }}>
                      {r.short_description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  )
}
