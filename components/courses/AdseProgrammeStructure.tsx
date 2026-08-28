// Premium dark "programme roadmap" for the ADSE course page: communicates
// Two Years → Four Terms → Seven Specialisations as a sequential journey.
// Content is unchanged from the official programme map — only the
// presentation is redesigned (numbered steps, year grouping, spec pills).
import {
  adseCoreTerms,
  adseTerm3Detailed,
  adseTerm4Specialised,
  adseTerm4Named
} from '../../data/adse'

type Step = {
  index: string
  title: string
  meta: string
  pills?: string[]
}

const term4PillLabels = [
  ...adseTerm4Named.map((t) => t.label.replace(/^Term 4[a-d] — /, '')),
  ...adseTerm4Specialised.map((t) => t.label.replace(/^Term 4[e-g] — /, ''))
]

const steps: Step[] = [
  {
    index: '01',
    title: adseCoreTerms[0].label,
    meta: `${adseCoreTerms[0].hours} · ${adseCoreTerms[0].eProject} eProject`
  },
  {
    index: '02',
    title: adseCoreTerms[1].label,
    meta: `${adseCoreTerms[1].hours} · ${adseCoreTerms[1].eProject} eProject`
  },
  {
    index: '03',
    title: 'Term 3',
    meta: `${adseTerm3Detailed.hours} · choice of pathway`,
    pills: ['Java', '.NET']
  },
  {
    index: '04',
    title: 'Term 4',
    meta: '7 specialisation pathways',
    pills: term4PillLabels
  }
]

function ArrowRight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 12h14.5M13 6l6 6-6 6" />
    </svg>
  )
}

function ArrowDown() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4.5v14.5M6 13l6 6 6-6" />
    </svg>
  )
}

function MetricPill({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-amber-400)' }}>
        {n}
      </span>
      <span
        className="font-mono text-[0.68rem] sm:text-xs uppercase tracking-[0.12em]"
        style={{ color: 'rgba(255,255,255,0.65)' }}
      >
        {label}
      </span>
    </div>
  )
}

function StepCard({ step }: { step: Step }) {
  return (
    <div className="adse-step-card p-6 sm:p-7 h-full">
      <span className="font-mono text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--color-amber-400)' }}>
        {step.index}
      </span>
      <h3
        className="mt-4 font-display text-[1.1rem]"
        style={{ color: '#fff', fontWeight: 700, letterSpacing: '-0.015em' }}
      >
        {step.title}
      </h3>
      <p
        className="mt-2 font-mono text-[0.68rem] tracking-wide uppercase"
        style={{ color: 'rgba(255,255,255,0.62)' }}
      >
        {step.meta}
      </p>
      {step.pills && (
        <div
          className="mt-5 pt-4 flex flex-wrap gap-1.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          {step.pills.map((p) => (
            <span key={p} className="adse-pill">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function YearGroup({ label, groupSteps }: { label: string; groupSteps: Step[] }) {
  return (
    <div className="relative pt-8">
      <div aria-hidden="true" className="absolute top-0 left-0 right-0 adse-year-rule" />
      <span
        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 font-mono text-[0.68rem] tracking-[0.16em] uppercase whitespace-nowrap"
        style={{ background: 'var(--color-navy-950)', color: 'var(--color-amber-400)' }}
      >
        {label}
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-5 sm:gap-4 items-stretch">
        <StepCard step={groupSteps[0]} />
        <div className="flex sm:flex-col items-center justify-center adse-metric-arrow py-1 sm:py-0">
          <span className="sm:hidden"><ArrowDown /></span>
          <span className="hidden sm:block"><ArrowRight /></span>
        </div>
        <StepCard step={groupSteps[1]} />
      </div>
    </div>
  )
}

export default function AdseProgrammeStructure() {
  return (
    <div>
      {/* Top-level progression summary: 2 Years → 4 Terms → 7 Specialisations */}
      <div
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 pb-8 mb-10 sm:mb-12"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <MetricPill n="2" label="Years" />
        <span className="adse-metric-arrow"><ArrowRight /></span>
        <MetricPill n="4" label="Terms" />
        <span className="adse-metric-arrow"><ArrowRight /></span>
        <MetricPill n="7" label="Specialisations" />
      </div>

      <div className="space-y-12 sm:space-y-14">
        <YearGroup label="Year 1" groupSteps={[steps[0], steps[1]]} />

        <div className="flex justify-center adse-metric-arrow" aria-hidden="true">
          <ArrowDown />
        </div>

        <YearGroup label="Year 2" groupSteps={[steps[2], steps[3]]} />
      </div>
    </div>
  )
}
