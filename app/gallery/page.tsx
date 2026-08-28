import PageHero from '../../components/shared/PageHero'
import Container from '../../components/ui/Container'
import Gallery from '../../components/gallery/Gallery'

export const metadata = {
  title: { absolute: 'Gallery | APTECH Abeokuta' },
  description: 'Explore the learning environment, technology, classes and community experience represented across the APTECH Abeokuta website.'
}

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Campus life"
        title="Life at APTECH Abeokuta"
        description="A visual look at technology-focused learning, practical work and the environment behind the APTECH Abeokuta experience. Approved campus photography can be added as it becomes available."
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
            <p className="text-sm text-[var(--color-muted)] lg:text-right">Photography placeholders are clearly marked until verified images are supplied.</p>
          </div>
          <Gallery />
        </Container>
      </section>
    </>
  )
}
