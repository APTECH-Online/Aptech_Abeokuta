import Hero from '../../components/hero/Hero'
import { getPublishedCourses } from '../../lib/courses-public'
import CourseCard from '../../components/courses/CourseCard'
import Link from 'next/link'
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
import { getPublishedInsights } from '../../lib/insights-public'
import { getPublishedTestimonials } from '../../lib/testimonials-public'
import { getPublishedFaqs } from '../../lib/faqs-public'
import { faqJsonLd } from '../../lib/structured-data'

export const metadata = {
  title: 'Build Your Future with Technology',
  description:
    'Gain practical IT skills, industry-focused training, and career-ready knowledge at APTECH Abeokuta.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'APTECH Abeokuta — Build Your Future with Technology',
    description: 'Gain practical IT skills, industry-focused training, and career-ready knowledge at APTECH Abeokuta.',
    url: '/'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'APTECH Abeokuta — Build Your Future with Technology',
    description: 'Gain practical IT skills, industry-focused training, and career-ready knowledge at APTECH Abeokuta.'
  }
}

export default async function Home() {
  const insights = await getPublishedInsights({ limit: 3 })
  const courses = await getPublishedCourses()
  const testimonials = await getPublishedTestimonials(3)
  const faqs = await getPublishedFaqs()
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
      />
      <Hero />
      <StatsBand courses={courses} />

      <section className="section-tight">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="Program finder"
            title="Which programme is right for you?"
            description="Answer two quick questions and we'll point you to the APTECH Abeokuta programme that best fits your goals."
            align="center"
          />
          <div className="mt-8">
            <ProgramFinder courses={courses} />
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
            <Testimonials items={testimonials} />
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Insights"
              title="Career guides & technology explainers"
              description="Practical guidance on tech careers, learning to code, and choosing the right programme."
            />
            <Link href="/insights" className="btn btn-secondary shrink-0">View all insights</Link>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {insights.slice(0, 3).map((post) => (
              <article key={post.slug} className="card p-6 flex flex-col">
                <p className="eyebrow">{post.category}</p>
                <h3 className="mt-3 font-display font-semibold text-[1rem] text-[var(--color-ink)] leading-snug">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed flex-1" style={{ color: 'var(--color-body)' }}>
                  {post.short_description}
                </p>
                <Link
                  href={`/insights/${post.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: 'var(--color-teal-700)' }}
                >
                  Read article
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)' }}>
        <Container className="max-w-3xl">
          <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
          <div className="mt-8">
            <FAQSection faqs={faqs} />
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
