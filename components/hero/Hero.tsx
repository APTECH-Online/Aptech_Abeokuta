import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Check,
  Code2,
  FileCode2,
  Folder,
  GraduationCap,
  Laptop,
  Terminal
} from 'lucide-react'

function OrbitalIllustration() {
  return (
    <div className="hero-orbit" aria-hidden="true">
      <div className="hero-orbit__halo hero-orbit__halo--one" />
      <div className="hero-orbit__halo hero-orbit__halo--two" />
      <div className="hero-orbit__ring hero-orbit__ring--one" />
      <div className="hero-orbit__ring hero-orbit__ring--two" />
      <div className="hero-orbit__ring hero-orbit__ring--three" />
      <div className="hero-orbit__cross hero-orbit__cross--vertical" />
      <div className="hero-orbit__cross hero-orbit__cross--horizontal" />
      <span className="hero-orbit__node hero-orbit__node--top" />
      <span className="hero-orbit__node hero-orbit__node--right" />
      <span className="hero-orbit__node hero-orbit__node--bottom" />
      <span className="hero-orbit__node hero-orbit__node--left" />

      <div className="hero-code-window">
        <div className="hero-code-window__bar">
          <span className="hero-window-dot hero-window-dot--red" />
          <span className="hero-window-dot hero-window-dot--amber" />
          <span className="hero-window-dot hero-window-dot--green" />
          <span className="hero-code-window__title">project / src / main.py</span>
        </div>
        <div className="hero-code-window__body">
          <aside className="hero-code-tree">
            <div><Folder size={12} /> project</div>
            <div className="hero-code-tree__indent"><Folder size={12} /> src</div>
            <div className="hero-code-tree__file"><FileCode2 size={12} /> main.py</div>
            <div className="hero-code-tree__indent"><Folder size={12} /> components</div>
            <div className="hero-code-tree__indent"><Folder size={12} /> utils</div>
            <div className="hero-code-tree__indent"><FileCode2 size={12} /> README.md</div>
          </aside>
          <div className="hero-code-lines">
            <div><span>1</span><code><i>def</i> <b>build_future</b>():</code></div>
            <div><span>2</span><code>&nbsp;&nbsp;skills = [</code></div>
            <div><span>3</span><code>&nbsp;&nbsp;&nbsp;&nbsp;<em>"Python"</em>,</code></div>
            <div><span>4</span><code>&nbsp;&nbsp;&nbsp;&nbsp;<em>"Web Development"</em>,</code></div>
            <div><span>5</span><code>&nbsp;&nbsp;&nbsp;&nbsp;<em>"Cloud &amp; DevOps"</em>,</code></div>
            <div><span>6</span><code>&nbsp;&nbsp;&nbsp;&nbsp;<em>"Problem Solving"</em></code></div>
            <div><span>7</span><code>&nbsp;&nbsp;]</code></div>
            <div><span>8</span><code>&nbsp;</code></div>
            <div><span>9</span><code>&nbsp;&nbsp;<strong>return</strong> skills</code></div>
          </div>
        </div>
      </div>

      <div className="hero-status-pill">
        <span className="hero-status-pill__dot" />
        Applications Open
      </div>

      <div className="hero-learning-pills">
        <span><GraduationCap size={15} /> Learn</span>
        <span><Code2 size={15} /> Build</span>
        <span><BarChart3 size={15} /> Grow</span>
      </div>

      <div className="hero-feature-card">
        <div className="hero-feature-card__icon"><Laptop size={19} /></div>
        <div>
          <p>FEATURED PROGRAMME</p>
          <strong>Software Development</strong>
          <span>Learn · Build · Launch</span>
        </div>
        <ArrowRight size={17} />
      </div>
    </div>
  )
}

export default function Hero() {
  const benefits = [
    'Hands-on practical learning',
    'Industry-relevant curriculum',
    'Certified and globally recognised'
  ]

  return (
    <section className="hero-premium relative overflow-hidden">
      <div className="hero-premium__grid" aria-hidden="true" />
      <div className="hero-premium__glow hero-premium__glow--one" aria-hidden="true" />
      <div className="hero-premium__glow hero-premium__glow--two" aria-hidden="true" />

      <div className="container relative z-10 py-14 sm:py-20 lg:py-20 xl:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[0.94fr_1.06fr] gap-10 xl:gap-4 items-center">
          <div className="max-w-2xl">
            <div className="hero-eyebrow">
              <Terminal size={14} aria-hidden="true" />
              <span>SOFTWARE DEVELOPMENT &amp; TECH PROGRAMMES</span>
            </div>

            <h1 className="hero-title mt-6">
              Build your future with <span>practical technology</span> skills.
            </h1>

            <p className="hero-description mt-6 max-w-xl">
              Career-focused technology education across our programme areas: Advanced Diploma in Software Engineering, Smart Pro, Aptech Certified Network Specialist, and a range of short-term courses.
            </p>

            <div className="mt-8 flex flex-wrap gap-3.5">
              <Link href="/courses" className="hero-btn hero-btn--primary">
                Explore Courses <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/admissions" className="hero-btn hero-btn--secondary">
                Apply for Admission
              </Link>
            </div>

            <ul className="hero-benefits mt-8" aria-label="Programme benefits">
              {benefits.map((benefit) => (
                <li key={benefit}>
                  <span><Check size={11} strokeWidth={3} /></span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-visual-wrap">
            <OrbitalIllustration />
          </div>
        </div>
      </div>
    </section>
  )
}
