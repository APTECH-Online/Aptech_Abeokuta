import Hero from '../components/hero/Hero'
import { courses } from '../data/courses'
import CourseCard from '../components/courses/CourseCard'
import Link from 'next/link'
import Testimonials from '../components/testimonials/Testimonials'
import Container from '../components/ui/Container'
import SectionHeading from '../components/ui/SectionHeading'
import WhyChoose from '../components/home/WhyChoose'
import StatsBand from '../components/home/StatsBand'
import FAQSection from '../components/home/FAQSection'
import CTABand from '../components/home/CTABand'
import BuildSection from '../components/home/BuildSection'
import PartnerLogos from '../components/shared/PartnerLogos'

export const metadata = {
  title: 'Build Your Future with Technology',
  description:
    'Gain practical IT skills, industry-focused training, and career-ready knowledge at APTECH Abeokuta.'
}

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBand />

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

      <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
        <Container>
          <SectionHeading eyebrow="Why APTECH" title="Why choose APTECH Abeokuta" />
          <WhyChoose />
        </Container>
      </section>

      <BuildSection />

      <section className="section-tight">
        <Container>
          <div className="card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
            <div>
              <p className="eyebrow">Partners & alliances</p>
              <h2 className="h-section mt-2" style={{ fontSize: '1.35rem' }}>
                Backed by Avigo Investment Limited, connected to Middlesex &amp; Portsmouth Universities
              </h2>
              <p className="lede mt-2" style={{ fontSize: '0.95rem' }}>
                A Nigerian-owned network partner, plus a pathway to a BSc in Software Engineering through our university alliance.
              </p>
            </div>
            <Link href="/about#partners" className="btn btn-secondary shrink-0">Meet our partners</Link>
          </div>
          <PartnerLogos />
        </Container>
      </section>

      <section className="section">
        <Container>
          <SectionHeading eyebrow="Student stories" title="What students say" />
          <div className="mt-8">
            <Testimonials />
          </div>
        </Container>
      </section>

      <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)' }}>
        <Container className="max-w-3xl">
          <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
          <div className="mt-8">
            <FAQSection />
          </div>
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
