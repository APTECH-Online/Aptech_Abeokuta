import Hero from '../../components/hero/Hero'
import { getPublishedCourses } from '../../lib/courses-public'
import CourseCard from '../../components/courses/CourseCard'
import Link from 'next/link'
import { ArrowRight, Handshake } from 'lucide-react'
import IconTile from '../../components/ui/IconTile'
import Testimonials from '../../components/testimonials/Testimonials'
import Container from '../../components/ui/Container'
import SectionHeading from '../../components/ui/SectionHeading'
import WhyChoose from '../../components/home/WhyChoose'
import CareerPaths from '../../components/home/CareerPaths'
import ProgramFinder from '../../components/home/ProgramFinder'
import StatsBand from '../../components/home/StatsBand'
import FAQSection from '../../components/home/FAQSection'
import CTABand from '../../components/home/CTABand'
import BuildSection from '../../components/home/BuildSection'
import PartnerLogos from '../../components/shared/PartnerLogos'
import LatestUpdates from '../../components/home/LatestUpdates'
import TechChallenge from '../../components/home/TechChallenge'
import { getPublicContactInfo } from '../../lib/contact-info-public'
import { getPublishedTestimonials } from '../../lib/testimonials-public'
import { getPublishedFaqs } from '../../lib/faqs-public'
import { getPublishedPartnersHighlight } from '../../lib/partners-public'
import { faqJsonLd } from '../../lib/structured-data'
import { buildMetadata } from '../../lib/seo'
import JsonLd from '../../components/shared/JsonLd'

export const metadata = buildMetadata({
  title: 'APTECH Abeokuta | Computer & IT Training in Abeokuta, Ogun State',
  description:
    'Learn software development, data science, networking and practical IT skills at APTECH Abeokuta. Advanced Diploma, Smart Pro and short courses. Apply today.',
  path: '/'
})

export default async function Home() {
  const courses = await getPublishedCourses()
  const testimonials = await getPublishedTestimonials(3)
  const faqs = await getPublishedFaqs()
  const partnersHighlight = await getPublishedPartnersHighlight()
  const { whatsapp } = await getPublicContactInfo()
  return (
    <>
      {/* FAQPage schema mirrors the visible FAQ accordion below; null (nothing rendered) when there are no published FAQs. */}
      <JsonLd data={faqJsonLd(faqs)} />
      <Hero />
      <StatsBand courses={courses} />

      <section id="programme-discovery" className="section program-finder-section">
        <Container className="max-w-6xl">
          <SectionHeading
            eyebrow="Programme finder"
            title="Which programme is right for you?"
            description="Answer five quick questions and we'll point you toward the APTECH Abeokuta programme that best fits your goals."
            align="center"
          />
          <div className="mt-10">
            <ProgramFinder courses={courses} whatsapp={whatsapp} />
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Course catalogue"
              title="Popular programmes"
              description="A snapshot of our training tracks — from beginner digital skills to full-stack software development."
            />
            <Link href="/courses" className="btn btn-secondary shrink-0">View all courses</Link>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <CourseCard key={c.slug} course={c} />
            ))}
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <SectionHeading
            eyebrow="Career paths"
            title="Learn. Build. Certify. Launch."
            description="Each APTECH Abeokuta programme is mapped to real skills and job-role-aligned outcomes — see where each path can take you."
          />
          <CareerPaths courses={courses} />
        </Container>
      </section>

      <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
        <Container>
          <SectionHeading eyebrow="Why APTECH" title="Why choose APTECH Abeokuta" />
          <WhyChoose />
        </Container>
      </section>

      <BuildSection />

      <section className="section-tight">
        <Container>
          <TechChallenge whatsapp={whatsapp} />
        </Container>
      </section>

      <section className="section-tight">
        <Container>
          <div className="alliance-panel">
            <div className="alliance-top">
              <IconTile icon={Handshake} tone="navy" size="lg" className="alliance-icon" />
              <div className="alliance-copy">
                <p className="eyebrow">Partners & alliances</p>
                <h2 className="h-section mt-2" style={{ fontSize: '1.35rem' }}>
                  {partnersHighlight?.headline ?? 'Backed by Avigo Investment Limited, connected to Middlesex & Portsmouth Universities'}
                </h2>
                <p className="lede mt-2" style={{ fontSize: '0.95rem' }}>
                  {partnersHighlight?.description ?? 'A Nigerian-owned network partner, plus a pathway to a BSc in Software Engineering through our university alliance.'}
                </p>
              </div>
              <Link href={partnersHighlight?.cta_href ?? '/about#partners'} className="btn btn-secondary alliance-cta">
                {partnersHighlight?.cta_label ?? 'Meet our partners'}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <PartnerLogos variant="embedded" />
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

      <LatestUpdates />

      <section className="section-tight faq-section">
        <Container className="max-w-6xl">
          <FAQSection faqs={faqs} whatsapp={whatsapp} />
        </Container>
      </section>

      <section className="section-tight">
        <Container>
          <CTABand />
        </Container>
      </section>
    </>
  )
}
