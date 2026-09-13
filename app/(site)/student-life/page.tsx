import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Hammer, Trophy, Users, TrendingUp, PartyPopper, ArrowRight } from 'lucide-react'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import SectionHeading from '../../../components/ui/SectionHeading'
import Testimonials from '../../../components/testimonials/Testimonials'
import CTABand from '../../../components/home/CTABand'
import { breadcrumbJsonLd } from '../../../lib/structured-data'
import { getPublishedTestimonials } from '../../../lib/testimonials-public'

export const metadata = {
  title: 'Student Life',
  description: 'Life at APTECH Abeokuta — hands-on learning, campus community, and career-focused training.',
  alternates: { canonical: '/student-life' },
  openGraph: {
    title: 'Student Life — APTECH Abeokuta',
    description: 'Life at APTECH Abeokuta — hands-on learning, campus community, and career-focused training.',
    url: '/student-life'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student Life — APTECH Abeokuta',
    description: 'Life at APTECH Abeokuta — hands-on learning, campus community, and career-focused training.'
  }
}

// Every claim here maps to something already verified elsewhere in the
// codebase (data/site.ts's whyChoose pillars, or components/gallery/Gallery.tsx's
// real photo captions) rather than inventing new activities or events.
const pillars = [
  {
    icon: BookOpen,
    title: 'Learn',
    body: 'Instructor-led classes combine theory with hands-on lab time, moving from fundamentals to applied practice at every stage of a programme.'
  },
  {
    icon: Hammer,
    title: 'Build',
    body: 'Coursework is built around applied projects and eProjects that mirror real workplace tasks, not passive lectures.'
  },
  {
    icon: Trophy,
    title: 'Compete',
    body: 'Students have represented APTECH Abeokuta at Aptech Career Quest, a nationwide competition held in association with Middlesex University.'
  },
  {
    icon: Users,
    title: 'Connect',
    body: 'A local campus community of instructors and cohort classmates, learning and working through the same material together.'
  },
  {
    icon: TrendingUp,
    title: 'Grow',
    body: 'Structured, career-focused guidance helps students prepare for interviews and next steps as they move through a programme.'
  },
  {
    icon: PartyPopper,
    title: 'Celebrate',
    body: 'Milestones — from completing a term to finishing a programme — are marked as part of campus life, alongside events like Career Quest.'
  }
]

export default async function StudentLifePage() {
  const testimonials = await getPublishedTestimonials(3)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Student Life' }]))
        }}
      />
      <PageHero
        eyebrow="Student life"
        title="Life at APTECH Abeokuta"
        description="Technology education is more than a classroom — it's the projects you build, the cohort you learn alongside, and the milestones you reach together."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Student Life' }]}
      />

      <section className="section">
        <Container>
          <SectionHeading
            eyebrow="Learn → Build → Certify → Launch"
            title="What campus life actually looks like"
          />
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((p) => (
              <div key={p.title} className="card p-6">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--color-teal-50)', color: 'var(--color-teal-700)' }}
                >
                  <p.icon aria-hidden="true" className="w-5 h-5" />
                </div>
                <h3 className="mt-4 font-display font-semibold text-[1.02rem] text-[var(--color-ink)]">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>{p.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-line)' }}>
              <Image
                src="/images/gallery/event-1.jpg"
                alt="A group of students at the APTECH Career Quest event, held in association with Middlesex University"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="eyebrow">Events</p>
              <h2 className="h-section mt-2">Aptech Career Quest</h2>
              <p className="mt-3 lede">
                Students take part in Aptech Career Quest, a nationwide competition held in association with
                Middlesex University — a chance to put classroom skills to the test outside the campus.
              </p>
              <Link href="/gallery" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--color-teal-700)' }}>
                See more from the gallery
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <SectionHeading eyebrow="Student stories" title="What students say" />
          <div className="mt-8">
            <Testimonials items={testimonials} />
          </div>
        </Container>
      </section>

      <section className="section-tight">
        <Container>
          <CTABand
            title="Ready to become part of it?"
            description="Explore the programme areas at APTECH Abeokuta, or start an application today."
          />
        </Container>
      </section>
    </>
  )
}
