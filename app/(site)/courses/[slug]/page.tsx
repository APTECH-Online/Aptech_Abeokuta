import { notFound } from 'next/navigation'
import Link from 'next/link'
import { courses, getCourseBySlug, getRelatedCourses } from '../../../../data/courses'
import Container from '../../../../components/ui/Container'
import Breadcrumbs from '../../../../components/shared/Breadcrumbs'
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

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const course = getCourseBySlug(slug)
  if (!course) return { title: 'Course not found' }
  return { title: course.title, description: course.summary }
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params
  const course = getCourseBySlug(slug)
  if (!course) notFound()

  const related = getRelatedCourses(course)

  return (
    <>
      <section className="border-b hairline pattern-adire" style={{ background: 'var(--color-navy-900)' }}>
        <div className="container py-12 sm:py-16">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Courses', href: '/courses' },
              { label: course.title }
            ]}
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
              <h1 className="h-display mt-2" style={{ color: '#fff' }}>{course.title}</h1>
            </div>
          </div>
          <div className="mt-4 flex flex-col lg:flex-row gap-8 items-start">
            <p className="max-w-2xl text-[1.05rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
              {course.summary}
            </p>
            {course.coverImage && (
              <div className="hidden lg:block w-64 rounded-lg overflow-hidden border border-white/10 shrink-0">
                <Image src={course.coverImage} alt="" width={1366} height={768} className="w-full h-auto block" priority />
              </div>
            )}
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
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    ['01', 'Term 1', 'Programming & web foundations'],
                    ['02', 'Term 2', 'Markup, programming & Java'],
                    ['03', 'Term 3', 'Java application development'],
                    ['04', 'Term 4', 'Specialisations & projects']
                  ].map(([n, term, label]) => (
                    <div key={n} className="card p-4">
                      <span className="eyebrow">{n}</span>
                      <h3 className="mt-1 font-display font-semibold text-sm text-[var(--color-ink)]">{term}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{label}</p>
                    </div>
                  ))}
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
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-4">
                <span className="eyebrow">Start</span>
                <h3 className="mt-1 font-display font-semibold text-sm text-[var(--color-ink)]">Foundation</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">146 hours · Excel, Python, R, large data management</p>
              </div>
              {smartProTracks.map((t) => (
                <div key={t.id} className="card p-4">
                  <span className="eyebrow">Specialise</span>
                  <h3 className="mt-1 font-display font-semibold text-sm text-[var(--color-ink)]">{t.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
                    {t.hours} · {t.diploma?.name} ({t.diploma?.hours})
                  </p>
                </div>
              ))}
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
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {acnsTerms.map((t, i) => (
                <div key={t.id} className="card p-4">
                  <span className="eyebrow">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-1 font-display font-semibold text-sm text-[var(--color-ink)]">{t.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{t.totalHours} hrs · {t.exitProfile}</p>
                </div>
              ))}
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

              <h3 className="mt-8 font-display font-semibold text-[1.15rem] text-[var(--color-ink)]">What you'll learn</h3>
              <ul className="mt-4 space-y-3">
                {course.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 text-sm" style={{ color: 'var(--color-body)' }}>
                    <span
                      aria-hidden="true"
                      className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0"
                      style={{ background: 'var(--color-teal-50)', color: 'var(--color-teal-700)' }}
                    >
                      ✓
                    </span>
                    {h}
                  </li>
                ))}
              </ul>

              <h3 className="mt-8 font-display font-semibold text-[1.15rem] text-[var(--color-ink)]">Tools &amp; technologies</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {course.tools.map((t) => (
                  <span key={t} className="badge badge-navy">{t}</span>
                ))}
              </div>

              <h3 className="mt-8 font-display font-semibold text-[1.15rem] text-[var(--color-ink)]">Programme outcomes</h3>
              <ul className="mt-4 space-y-3">
                {course.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-3 text-sm" style={{ color: 'var(--color-body)' }}>
                    <span aria-hidden="true" className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-amber-500)' }} />
                    {o}
                  </li>
                ))}
              </ul>
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
                  <p className="console-status">Applications open</p>
                  <div className="mt-4 space-y-2">
                    <p className="console-line"><span className="console-key">duration </span><span className="console-val">{course.duration}</span></p>
                    <p className="console-line"><span className="console-key">level    </span><span className="console-val">{course.level}</span></p>
                    <p className="console-line"><span className="console-key">format   </span><span className="console-val">{course.mode}</span></p>
                  </div>
                  <Link href="/admissions#apply" className="btn btn-accent btn-block mt-5">
                    Enroll now
                  </Link>
                  <Link href="/contact" className="btn btn-block mt-2" style={{ color: '#dbe4f3', border: '1px solid rgba(255,255,255,0.15)' }}>
                    Ask a question
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {related.length > 0 && (
        <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)' }}>
          <Container>
            <h2 className="h-section">Other programmes</h2>
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
