import Link from 'next/link'

export default function BuildSection() {
  return (
    <section className="relative overflow-hidden pattern-adire" style={{ background: 'var(--color-navy-950)' }}>
      <svg
        aria-hidden="true"
        className="absolute right-0 top-0 h-full w-auto opacity-25 pointer-events-none hidden md:block"
        viewBox="0 0 500 500"
        fill="none"
      >
        <g stroke="#EFC077" strokeWidth="1.2">
          <rect x="90" y="90" width="320" height="320" transform="rotate(45 250 250)" />
          <rect x="150" y="150" width="200" height="200" transform="rotate(45 250 250)" />
          <rect x="200" y="200" width="100" height="100" transform="rotate(45 250 250)" />
        </g>
        <g fill="#EFC077">
          <circle cx="250" cy="90" r="4" />
          <circle cx="250" cy="410" r="4" />
          <circle cx="90" cy="250" r="4" />
          <circle cx="410" cy="250" r="4" />
        </g>
      </svg>

      <div className="container py-20 sm:py-28 relative">
        <div className="max-w-2xl">
          <p className="eyebrow eyebrow-inverse">The APTECH standard</p>
          <h2 className="h-display mt-4" style={{ color: '#fff' }}>
            Build skills that move you forward.
          </h2>
          <p className="mt-5 text-[1.05rem] leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Every track is built around applied projects, not passive lectures — so what you
            learn in class is the same thing you'll be doing in a job. Small cohorts, real
            tools, and instructors who've worked the roles they teach toward.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/courses" className="btn btn-accent">See training tracks</Link>
            <Link href="/about" className="btn btn-secondary" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
              Our approach
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
