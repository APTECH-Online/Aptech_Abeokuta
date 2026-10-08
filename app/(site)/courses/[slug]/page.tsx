import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import { getPublishedCourses, getPublishedCourseBySlug, getRelatedCourses, getCourseHeading } from '../../../../lib/courses-public'
import { admissionUi } from '../../../../lib/admission'
import { parseCurriculum } from '../../../../lib/curriculum'
import Container from '../../../../components/ui/Container'
import Breadcrumbs from '../../../../components/shared/Breadcrumbs'
import LearnCards from '../../../../components/courses/LearnCards'
import CourseCard from '../../../../components/courses/CourseCard'
import CourseIcon from '../../../../components/ui/CourseIcon'
import AdseRoadmap from '../../../../components/courses/AdseRoadmap'
import AdseProgrammeStructure from '../../../../components/courses/AdseProgrammeStructure'
import AdseTermCard from '../../../../components/courses/AdseTermCard'
import AdseSpecialisationTabs from '../../../../components/courses/AdseSpecialisationTabs'
import AdseIndustrySnapshot from '../../../../components/courses/AdseIndustrySnapshot'
import { adseCoreTerms, adseTerm3Detailed, adseTerm3bDetailed, adseTerm4Named } from '../../../../data/adse'
import SmartProTrackCard from '../../../../components/courses/SmartProTrackCard'
import { smartProFoundation, smartProTracks } from '../../../../data/smartpro'
import AcnsTermCard from '../../../../components/courses/AcnsTermCard'
import { acnsTerms } from '../../../../data/acns'
import Image from 'next/image'
import { Award, BookOpen, ClipboardCheck, Clock, Gauge, Laptop, Users } from 'lucide-react'
import TermSteps from '../../../../components/courses/TermSteps'
import StoryCard from '../../../../components/testimonials/StoryCard'
import { courseJsonLd, breadcrumbJsonLd } from '../../../../lib/structured-data'
import { buildMetadata, getSiteUrl, pickTitle, truncate } from '../../../../lib/seo'
import { findSlugRedirect } from '../../../../lib/seo-redirects'
import { getInsightsBySlugs } from '../../../../lib/insights-public'
import { COURSE_TOPICS } from '../../../../lib/topics'
import { siteConfig } from '../../../../data/site'
import JsonLd from '../../../../components/shared/JsonLd'
import CompareCourseButton from '../../../../components/courses/CompareCourseButton'
import CareerPathways from '../../../../components/courses/CareerPathways'
import CourseConversionLink from '../../../../components/courses/CourseConversionLink'
import { getPublishedTestimonials } from '../../../../lib/testimonials-public'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const course = await getPublishedCourseBySlug(slug)
  if (!course) return { title: 'Course not found', robots: { index: false, follow: false } }

  // CMS-controlled SEO fields win; otherwise generate a unique, length-safe
  // title and use the course's own summary (unique per course) as description.
  const title =
    course.seoTitle ||
    pickTitle([
      `${course.title} Course in Abeokuta | ${siteConfig.name}`,
      `${course.title} in Abeokuta | ${siteConfig.name}`,
      `${course.title} | ${siteConfig.name}`,
      course.title
    ])
  return buildMetadata({
    title,
    description: course.seoDescription || truncate(course.summary, 158),
    path: `/courses/${course.slug}`,
    image: course.coverImage,
    imageAlt: `${course.title} at ${siteConfig.name}`,
    noindex: course.noindex
  })
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params
  const course = await getPublishedCourseBySlug(slug)
  if (!course) {
    // Slug was renamed in the CRM → permanent redirect to the new URL; otherwise a real 404.
    const target = await findSlugRedirect('/courses', slug)
    if (target) permanentRedirect(target)
    notFound()
  }

  const allCourses = await getPublishedCourses()
  const related = getRelatedCourses(allCourses, course)
  const studentStories = await getPublishedTestimonials()
  const storyProgramme = course.category === 'Advanced Diploma'
    ? 'adse'
    : course.category === 'Smart Pro'
      ? 'smart'
      : course.category === 'Aptech Certified Network Specialist'
        ? 'acns'
        : null
  const courseStory = storyProgramme
    ? studentStories.filter((story) => story.program.toLowerCase().includes(storyProgramme))
    : []
  // Hand-picked guides (lib/topics.ts); only published, indexable ones come back.
  const CHOOSER_SLUG = 'choosing-between-short-course-and-diploma'
  // CRM-chosen guides once migration 0023 is in place; the in-code map only before it.
  const guideSlugs = course.controlsLoaded ? course.relatedInsights : COURSE_TOPICS[course.slug]?.relatedInsights ?? []
  const admission = admissionUi(course.admissionStatus)
  const curriculum = parseCurriculum(course.curriculum).blocks
  const fetchedGuides = await getInsightsBySlugs(Array.from(new Set([...guideSlugs, CHOOSER_SLUG])))
  const relatedGuides = fetchedGuides.filter((g) => guideSlugs.includes(g.slug))
  // Only link the programme-length guide when it is actually published (never a dead link).
  const chooserGuide = fetchedGuides.find((g) => g.slug === CHOOSER_SLUG)
  const baseUrl = getSiteUrl()
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    { label: course.title }
  ]

  return (
    <>
      <JsonLd data={[courseJsonLd(baseUrl, course), breadcrumbJsonLd(baseUrl, crumbs)]} />
      <section className="border-b hairline pattern-adire" style={{ background: 'var(--color-navy-900)' }}>
        <div className="container py-12 sm:py-16">
          <Breadcrumbs
            items={crumbs}
          />
          <div className="mt-5 flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}
            >
              <CourseIcon category={course.category} slug={course.slug} />
            </div>
            <div>
              <p className="eyebrow eyebrow-inverse">{course.category}</p>
              <h1 className="h-display mt-2" style={{ color: '#fff' }}>{getCourseHeading(course)}</h1>
            </div>
          </div>
          <div className="mt-4 flex flex-col lg:flex-row gap-8 items-start">
            <p className="max-w-2xl text-[1.05rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
              {course.summary}
            </p>
            {course.coverImage && (
              <div className="hidden lg:block w-64 rounded-lg overflow-hidden border border-white/10 shrink-0">
                <Image
                  src={course.coverImage}
                  alt={`${course.title} programme overview`}
                  width={1366}
                  height={768}
                  sizes="256px"
                  className="w-full h-auto block"
                  priority
                />
              </div>
            )}
          </div>

          {/* Mobile only: the sidebar card below the page body is a long scroll away on a phone. */}
          <dl className="mt-6 grid grid-cols-3 gap-3 text-xs lg:hidden" style={{ color: 'rgba(255,255,255,0.75)' }}>
            <div>
              <dt className="eyebrow eyebrow-inverse" style={{ fontSize: '0.62rem' }}>Duration</dt>
              <dd className="mt-1" style={{ color: '#fff' }}>{course.duration}</dd>
            </div>
            <div>
              <dt className="eyebrow eyebrow-inverse" style={{ fontSize: '0.62rem' }}>Level</dt>
              <dd className="mt-1" style={{ color: '#fff' }}>{course.level}</dd>
            </div>
            <div>
              <dt className="eyebrow eyebrow-inverse" style={{ fontSize: '0.62rem' }}>Format</dt>
              <dd className="mt-1" style={{ color: '#fff' }}>{course.mode}</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap items-center gap-3 lg:hidden">
            <CourseConversionLink href={admission.href} event={admission.canApply ? "application_cta_clicked" : "enquiry_cta_clicked"} metadata={{ programmeSlug: course.slug, admissionStatus: course.admissionStatus }}>{admission.mobileLabel}</CourseConversionLink>
            {admission.canApply && (
              <Link href="/contact" className="btn" style={{ color: '#dbe4f3', border: '1px solid rgba(255,255,255,0.25)' }}>Ask a question</Link>
            )}
            <CompareCourseButton slug={course.slug} label="Compare programme" />
          </div>
        </div>
      </section>

      {course.slug === 'advanced-diploma-software-engineering' && (
        <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderBottom: '1px solid var(--color-line)' }}>
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
              <div>
                <p className="eyebrow">ADSE curriculum</p>
                <h2 className="h-section mt-2">A four-term software engineering pathway</h2>
                <p className="lede mt-4">
                  The supplied ADSE curriculum material maps the programme across four terms,
                  with progressive programming, web, application development, data, AI, IoT and
                  project-focused learning.
                </p>
                <div className="mt-6">
                  <TermSteps
                    columns={2}
                    items={[
                      { tag: 'Term 1', title: 'Programming & web foundations', note: 'Year 1' },
                      { tag: 'Term 2', title: 'Markup, programming & Java', note: 'Year 1' },
                      { tag: 'Term 3', title: 'Java application development', note: 'Year 2' },
                      { tag: 'Term 4', title: 'Specialisations & projects', note: 'Year 2' }
                    ]}
                  />
                </div>
              </div>
              <div className="card overflow-hidden">
                <AdseRoadmap />
              </div>
            </div>
          </Container>
        </section>
      )}

      {course.slug === 'advanced-diploma-software-engineering' && (
        <section className="section pattern-adire" style={{ background: 'var(--color-navy-950)', color: '#fff' }}>
          <Container>
            <p className="eyebrow eyebrow-inverse">Programme map</p>
            <h2
              className="h-section mt-3"
              style={{ color: '#fff', fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              Two years, four terms, seven specialisations
            </h2>
            <p className="mt-3 max-w-2xl lede" style={{ color: 'rgba(255,255,255,0.68)' }}>
              Year 1 builds a shared foundation. Year 2 opens into a Java or .NET
              application-development track in Term 3, then branches into seven
              Term 4 pathways — three with full module detail below.
            </p>
            <div
              className="mt-10 sm:mt-14 rounded-2xl border p-6 sm:p-10 lg:p-12"
              style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#fff' }}
            >
              <AdseProgrammeStructure />
            </div>
          </Container>
        </section>
      )}

      {course.slug === 'advanced-diploma-software-engineering' && (
        <section className="section">
          <Container>
            <p className="eyebrow">Year 1 — Curriculum detail</p>
            <h2 className="h-section mt-2">Term 1 &amp; Term 2 modules</h2>
            <p className="mt-3 max-w-2xl lede">
              Every ADSE student completes both terms, moving from programming
              fundamentals to Java, C# and Linux foundations.
            </p>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {adseCoreTerms.map((term, i) => (
                <AdseTermCard key={term.id} term={term} icon={i === 0 ? 'foundations' : 'markup-java'} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {course.slug === 'advanced-diploma-software-engineering' && (
        <section className="section" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
          <Container>
            <p className="eyebrow">Year 2 — Term 3</p>
            <h2 className="h-section mt-2">Application-development track</h2>
            <p className="mt-3 max-w-2xl lede">
              Term 3 splits into a Java or a .NET application-development pathway.
            </p>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <AdseTermCard term={adseTerm3Detailed} icon="java" />
              <AdseTermCard term={adseTerm3bDetailed} icon="dotnet" />
            </div>
          </Container>
        </section>
      )}

      {course.slug === 'advanced-diploma-software-engineering' && (
        <section className="section">
          <Container>
            <p className="eyebrow">Year 2 — Term 4</p>
            <h2 className="h-section mt-2">Choose your specialisation</h2>
            <p className="mt-3 max-w-2xl lede">
              Term 4 offers seven pathways. Explore the three with full module
              detail below, each ending in an industry-aligned exit profile.
            </p>
            <div className="mt-8">
              <AdseSpecialisationTabs />
            </div>

            <div className="mt-10">
              <p className="eyebrow">Also available in Term 4</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {adseTerm4Named.map((t) => (
                  <div key={t.id} className="card p-4">
                    <p className="font-display font-semibold text-sm text-[var(--color-ink)]">{t.label}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-muted)]">{t.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>
      )}

      {course.slug === 'advanced-diploma-software-engineering' && (
        <section className="section-tight" style={{ background: 'var(--color-navy-50)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
          <Container>
            <p className="eyebrow">Why software engineering, why now</p>
            <h2 className="h-section mt-2">Industry scenario &amp; career outlook</h2>
            <p className="mt-3 max-w-2xl lede">
              The demand data behind the ADSE curriculum, covering both the
              global technology market and Africa's fast-growing tech landscape.
            </p>
            <div className="mt-8">
              <AdseIndustrySnapshot />
            </div>
          </Container>
        </section>
      )}

      {course.slug === 'smart-pro' && (
        <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderBottom: '1px solid var(--color-line)' }}>
          <Container>
            <p className="eyebrow">Smart Pro · ACNPRO</p>
            <h2 className="h-section mt-2">One foundation, three specialisations</h2>
            <p className="mt-3 max-w-2xl lede">
              Aptech Certified Nxt Generation Professional (ACNPRO) starts every learner on a
              shared Foundation, then branches into Data Science, AI &amp; Machine Learning, or
              Software Testing — each ending in a Professional Diploma.
            </p>
            <div className="mt-8">
              <TermSteps
                items={[
                  { tag: 'Start', tone: 'amber', title: 'Foundation', note: '146 hours · Excel, Python, R, large data management' },
                  ...smartProTracks.map((t) => ({
                    tag: 'Specialise',
                    tone: 'teal' as const,
                    title: t.label,
                    note: `${t.hours} · ${t.diploma?.name} (${t.diploma?.hours})`
                  }))
                ]}
              />
            </div>
          </Container>
        </section>
      )}

      {course.slug === 'smart-pro' && (
        <section className="section">
          <Container>
            <p className="eyebrow">Shared foundation</p>
            <h2 className="h-section mt-2">Foundation modules</h2>
            <p className="mt-3 max-w-2xl lede">
              Every Smart Pro learner completes the Foundation before choosing a specialisation.
            </p>
            <div className="mt-8 max-w-xl">
              <SmartProTrackCard block={smartProFoundation} />
            </div>
          </Container>
        </section>
      )}

      {course.slug === 'smart-pro' && (
        <section className="section" style={{ background: 'var(--color-navy-50)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
          <Container>
            <p className="eyebrow">Choose your specialisation</p>
            <h2 className="h-section mt-2">Data Science, AI &amp; Machine Learning, or Software Testing</h2>
            <p className="mt-3 max-w-2xl lede">
              Each track builds on the Foundation with its own modules, software training and a
              job-role-aligned Professional Diploma.
            </p>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {smartProTracks.map((t) => (
                <SmartProTrackCard key={t.id} block={t} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {course.slug === 'aptech-certified-network-specialist' && (
        <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderBottom: '1px solid var(--color-line)' }}>
          <Container>
            <p className="eyebrow">ACNS curriculum</p>
            <h2 className="h-section mt-2">A four-term hardware &amp; networking pathway</h2>
            <p className="mt-3 max-w-2xl lede">
              Each term pairs theory and hands-on lab work with self-study, and maps directly to
              industry certification exams.
            </p>
            <div className="mt-6">
              <TermSteps
                items={acnsTerms.map((t, i) => ({
                  tag: `Term ${i + 1}`,
                  title: t.label,
                  note: `${t.totalHours} hrs · ${t.exitProfile}`
                }))}
              />
            </div>
          </Container>
        </section>
      )}

      {course.slug === 'aptech-certified-network-specialist' && (
        <section className="section">
          <Container>
            <p className="eyebrow">Term-by-term detail</p>
            <h2 className="h-section mt-2">Modules, hours &amp; certifications</h2>
            <p className="mt-3 max-w-2xl lede">
              Every module lists its instructional hours, tools and software, and the vendor
              certification exam it maps to where applicable.
            </p>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {acnsTerms.map((t) => (
                <AcnsTermCard key={t.id} term={t} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="section">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-12 items-start">
            <div>
              <h2 className="h-section">Overview</h2>
              <p className="lede mt-3">{course.description}</p>

              <div className="course-block">
                <h3 className="course-block-title">What you'll learn</h3>
                <LearnCards items={course.highlights} />
              </div>

              <div className="course-block">
                <h3 className="course-block-title">Tools &amp; technologies</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {course.tools.map((t) => (
                    <span key={t} className="badge badge-navy">{t}</span>
                  ))}
                </div>
              </div>

              <div className="course-block outcomes-panel">
                <h3 className="course-block-title">Programme outcomes</h3>
                <ul className="mt-4 space-y-3">
                  {course.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-3 text-[0.95rem] leading-relaxed" style={{ color: 'var(--color-body)' }}>
                      <span aria-hidden="true" className="node-mark mt-[0.55rem]" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>

              {curriculum.length > 0 && (
                <div className="course-block">
                  <h2 className="h-section" style={{ fontSize: '1.35rem' }}>{course.title} curriculum</h2>
                  <div className="mt-5 space-y-5">
                    {curriculum.map((b) => (
                      <section key={b.title} className="curriculum-block">
                        <h3 className="font-display font-semibold text-[1.05rem] text-[var(--color-ink)]">
                          {b.title}
                        </h3>
                        {b.subtitle && <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-muted)' }}>{b.subtitle}</p>}
                        {b.description && <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>{b.description}</p>}
                        {b.modules.length > 0 && (
                          <ul className="module-list">
                            {b.modules.map((m) => (
                              <li key={m.name} className="module-item">
                                <span className="module-name">{m.name}</span>
                                {m.detail && <span className="module-detail">{m.detail}</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    ))}
                  </div>
                </div>
              )}

              {(course.audience || course.prerequisites || course.certification) && (
                <div className="course-block space-y-4">
                  {course.audience && (
                    <div className="fit-card">
                      <span className="fit-icon" aria-hidden="true"><Users size={20} /></span>
                      <div>
                        <h2 className="fit-title">Who is {course.title} for?</h2>
                        <p className="fit-text">{course.audience}</p>
                      </div>
                    </div>
                  )}
                  {course.prerequisites && (
                    <div className="fit-card">
                      <span className="fit-icon" aria-hidden="true"><ClipboardCheck size={20} /></span>
                      <div>
                        <h2 className="fit-title">Entry requirements</h2>
                        <p className="fit-text">{course.prerequisites}</p>
                      </div>
                    </div>
                  )}
                  {course.certification && (
                    <div className="fit-card">
                      <span className="fit-icon" aria-hidden="true"><Award size={20} /></span>
                      <div>
                        <h2 className="fit-title">Certification</h2>
                        <p className="fit-text">{course.certification}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <h2 className="course-block h-section" style={{ fontSize: '1.35rem' }}>{course.title}: duration, level and format</h2>
              <dl className="fact-grid">
                <div className="fact-item">
                  <dt><Clock size={16} aria-hidden="true" /> How long is it?</dt>
                  <dd>{course.duration}</dd>
                </div>
                <div className="fact-item">
                  <dt><Gauge size={16} aria-hidden="true" /> Who is it pitched at?</dt>
                  <dd>{course.level} level</dd>
                </div>
                <div className="fact-item">
                  <dt><Laptop size={16} aria-hidden="true" /> How is it taught?</dt>
                  <dd>{course.mode}</dd>
                </div>
              </dl>
              <p className="mt-5 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                {course.prerequisites ? 'Fees and intake dates' : 'Entry requirements, fees and intake dates'} are confirmed by the admissions team, so
                check the <Link href="/admissions" className="font-semibold underline" style={{ color: 'var(--color-teal-700)' }}>admissions page</Link> or{' '}
                <Link href="/contact" className="font-semibold underline" style={{ color: 'var(--color-teal-700)' }}>contact the academy</Link> before you apply.{' '}
                {chooserGuide ? (
                  <>
                    Not sure whether a short course or a longer programme suits you? Compare them in{' '}
                    <Link href={`/insights/${chooserGuide.slug}`} className="font-semibold underline" style={{ color: 'var(--color-teal-700)' }}>{chooserGuide.title}</Link>, or{' '}
                  </>
                ) : (
                  <>Not sure this is the right fit? You can </>
                )}
                browse the <Link href="/courses" className="font-semibold underline" style={{ color: 'var(--color-teal-700)' }}>full course catalogue</Link>.
              </p>
            </div>

            <aside className="lg:sticky lg:top-24">
              <div className="console-card">
                <div className="console-card__bar">
                  <span className="console-card__dot" />
                  <span className="console-card__dot" />
                  <span className="console-card__dot" />
                  <span className="console-card__title">programme_info.sh</span>
                </div>
                <div className="console-card__body">
                  <p className="console-status" data-status={course.admissionStatus} style={{ color: admission.text }}>
                    <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: admission.dot, display: 'inline-block' }} />
                    {admission.statusLabel}
                  </p>
                  {course.intakeNote && <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{course.intakeNote}</p>}
                  <div className="mt-4 space-y-2">
                    <p className="console-line"><span className="console-key">duration </span><span className="console-val">{course.duration}</span></p>
                    <p className="console-line"><span className="console-key">level    </span><span className="console-val">{course.level}</span></p>
                    <p className="console-line"><span className="console-key">format   </span><span className="console-val">{course.mode}</span></p>
                  </div>
                  <CourseConversionLink href={admission.href} event={admission.canApply ? "application_cta_clicked" : "enquiry_cta_clicked"} metadata={{ programmeSlug: course.slug, admissionStatus: course.admissionStatus }} className="btn-block mt-5">
                    {admission.primaryLabel}
                  </CourseConversionLink>
                  <Link href="/contact" className="btn btn-block mt-2" style={{ color: '#dbe4f3', border: '1px solid rgba(255,255,255,0.15)' }}>
                    Ask a question
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {relatedGuides.length > 0 && (
        <section className="section-tight" style={{ borderTop: '1px solid var(--color-line)' }}>
          <Container>
            <h2 className="h-section">Guides related to {course.title}</h2>
            <ul className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedGuides.map((g) => (
                <li key={g.slug} className="guide-card">
                  <span className="fit-icon" aria-hidden="true"><BookOpen size={18} /></span>
                  <h3 className="font-display font-semibold text-[0.95rem] text-[var(--color-ink)] leading-snug mt-4">
                    <Link href={`/insights/${g.slug}`}>{g.title}</Link>
                  </h3>
                  {g.short_description && (
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{g.short_description}</p>
                  )}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <section className="section">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Career pathways</p>
              <h2 className="h-section mt-2">Where these skills can take you</h2>
              <p className="mt-3 max-w-2xl lede">
                Explore the skills published for this programme and the areas of work they may support. These are potential directions, not employment or placement guarantees.
              </p>
            </div>
            <CompareCourseButton slug={course.slug} label="Compare with another programme" />
          </div>
          <div className="mt-8">
            <CareerPathways course={course} />
          </div>
        </Container>
      </section>

      {courseStory.length > 0 && (
        <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
          <Container>
            <p className="eyebrow">Student stories</p>
            <h2 className="h-section mt-2">What learners say about this programme</h2>
            <div className="story-grid mt-8">
              {courseStory.slice(0, 3).map((story) => (
                <StoryCard key={story.id} item={story} />
              ))}
            </div>
            <Link href="/testimonials" className="btn btn-secondary btn-sm mt-8">
              View more student stories
            </Link>
          </Container>
        </section>
      )}

      {related.length > 0 && (
        <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)' }}>
          <Container>
            <h2 className="h-section">Related courses at APTECH Abeokuta</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((c) => (
                <CourseCard key={c.slug} course={c} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  )
}
