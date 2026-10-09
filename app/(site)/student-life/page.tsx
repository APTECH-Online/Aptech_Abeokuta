import { BookOpen, Hammer, Trophy, Users, TrendingUp, PartyPopper } from 'lucide-react'
import LifeCards from '../../../components/student-life/LifeCards'
import EventFeature from '../../../components/student-life/EventFeature'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import SectionHeading from '../../../components/ui/SectionHeading'
import Testimonials from '../../../components/testimonials/Testimonials'
import CTABand from '../../../components/home/CTABand'
import { breadcrumbJsonLd } from '../../../lib/structured-data'
import { getPublishedTestimonials } from '../../../lib/testimonials-public'
import { buildMetadata, getSiteUrl } from '../../../lib/seo'
import JsonLd from '../../../components/shared/JsonLd'

export const metadata = buildMetadata({
  title: 'Student Life at APTECH Abeokuta | Campus & Community',
  description:
    'See what student life at APTECH Abeokuta is like: hands-on learning, events such as Aptech Career Quest, and a career-focused campus community.',
  path: '/student-life'
})

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
  const baseUrl = getSiteUrl()
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Student Life' }])} />
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
          <div className="mt-10"><LifeCards items={pillars} /></div>
        </Container>
      </section>

      <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
        <Container>
          <EventFeature />
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
