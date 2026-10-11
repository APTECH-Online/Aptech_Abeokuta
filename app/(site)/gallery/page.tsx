import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import Gallery from '../../../components/gallery/Gallery'
import { breadcrumbJsonLd } from '../../../lib/structured-data'
import { getPublishedGalleryItems } from '../../../lib/gallery-public'
import { buildMetadata, getSiteUrl } from '../../../lib/seo'
import JsonLd from '../../../components/shared/JsonLd'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Photo Gallery | Campus & Events at APTECH Abeokuta',
  description:
    'Browse photos of the APTECH Abeokuta learning environment, technology, classes and student community.',
  path: '/gallery'
})

export default async function GalleryPage() {
  const baseUrl = getSiteUrl()
  const items = await getPublishedGalleryItems()
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Gallery' }])} />
      <PageHero
        eyebrow="Campus life"
        title="Photo gallery: campus life at APTECH Abeokuta"
        description="A visual look at technology-focused learning, practical work and the environment behind the APTECH Abeokuta experience."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Gallery' }]}
      />
      <section className="section">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <p className="eyebrow">The visual archive</p>
              <h2 className="h-section mt-2">Learning is better when you can see it.</h2>
              <p className="mt-3 max-w-2xl lede">Browse the spaces, people and activities that help make a practical technology-learning environment feel tangible.</p>
            </div>
          </div>
          <Gallery items={items} />
          {items.some((item) => /event|career quest|workshop|campus/i.test(`${item.category} ${item.title}`)) && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5" style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-alt)' }}>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Inspired by campus activities? Find a workshop, open day or upcoming event.</p>
              <Link href="/events" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-teal-700)' }}>
                Explore events <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
