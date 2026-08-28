import Link from 'next/link'
import Image from 'next/image'

export default function Hero() {
  return (
    <section
      className="relative pattern-adire overflow-hidden border-b hairline"
      style={{ background: 'var(--color-navy-950)' }}
    >
      <div className="container py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-10 items-center">
          <div>
            <p className="eyebrow eyebrow-inverse">APTECH Abeokuta · IT training centre</p>
            <h1 className="h-display mt-4" style={{ color: '#fff' }}>
              Build your future with practical technology skills.
            </h1>
            <p className="mt-5 max-w-lg text-[1.05rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Career-focused technology education across our programme areas: Advanced Diploma in
              Software Engineering, Smart Pro, Aptech Certified Network Specialist, and a range of
              short-term courses.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/courses" className="btn btn-accent">Explore courses</Link>
              <Link
                href="/admissions"
                className="btn btn-secondary"
                style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                Apply for admission
              </Link>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              {['Hands-on, project-based learning', 'Small, instructor-led cohorts', 'Career-focused curriculum'].map((t) => (
                <li key={t} className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.62)' }}>
                  <span className="node-mark" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <Image
                src="/images/hero-tech.svg"
                alt="Illustration of a code editor at the centre of a circuit and adire-pattern medallion"
                width={640}
                height={640}
                className="w-full h-auto"
                priority
              />

              <div className="float-card absolute -top-4 right-2 sm:right-6 px-4 py-2.5 flex items-center gap-2">
                <span className="console-status">Applications open</span>
              </div>

              <div className="float-card absolute -bottom-6 -left-2 sm:-left-8 p-4 w-52 sm:w-60">
                <p className="eyebrow" style={{ fontSize: '0.62rem' }}>Featured programme</p>
                <p className="mt-1.5 font-display font-semibold text-[0.95rem]" style={{ color: 'var(--color-ink)' }}>
                  Software Development
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>6 months · Beginner–Intermediate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
