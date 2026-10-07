import { ArrowRight, BarChart3, BookOpen, Check, Code2, Target } from 'lucide-react'

const codeLines = [
  { width: '30%', tone: 'muted' },
  { width: '68%', tone: 'blue' },
  { width: '82%', tone: 'purple' },
  { width: '54%', tone: 'blue' },
  { width: '40%', tone: 'teal' },
  { width: '76%', tone: 'muted' },
]

const bars = [38, 55, 78, 61, 92]

export default function AboutJourney() {
  return (
    <section className="about-journey" aria-labelledby="about-journey-title">
      <div className="container">
        <div className="about-journey-shell">
          <div className="about-journey-glow about-journey-glow-one" aria-hidden="true" />
          <div className="about-journey-glow about-journey-glow-two" aria-hidden="true" />
          <div className="about-journey-grid" aria-hidden="true" />
          <div className="about-journey-dots about-journey-dots-left" aria-hidden="true" />
          <div className="about-journey-dots about-journey-dots-right" aria-hidden="true" />
          <div className="about-journey-orbit about-journey-orbit-top" aria-hidden="true" />
          <div className="about-journey-orbit about-journey-orbit-bottom" aria-hidden="true" />

          <div className="about-journey-intro">
            <div>
              <p className="about-journey-kicker">The learning journey</p>
              <h2 id="about-journey-title">From learning to real-world impact.</h2>
            </div>
            <p>
              Build the knowledge, practical skills and confidence to take your next step in technology — one stage at a time.
            </p>
          </div>

          <div className="about-journey-track">
            <article className="journey-stage">
              <div className="journey-stage-heading">
                <div className="journey-icon journey-icon-blue"><BookOpen size={19} strokeWidth={2} /></div>
                <div><span>01</span><h3>Learn</h3></div>
              </div>
              <p className="journey-stage-copy">Build a strong foundation through structured, instructor-led technology education.</p>
              <div className="journey-window journey-code-window">
                <div className="journey-window-bar"><i /><i /><i /><span><Code2 size={13} /> learning-path</span></div>
                <div className="journey-code-lines">
                  {codeLines.map((line, index) => <span key={index} className={`code-line code-${line.tone}`} style={{ width: line.width }} />)}
                </div>
                <div className="journey-window-footer"><span>01</span><span>Foundation</span></div>
              </div>
            </article>

            <div className="journey-connector" aria-hidden="true"><span className="journey-connector-dot" /><span className="journey-connector-line" /><ArrowRight size={19} /></div>

            <article className="journey-stage">
              <div className="journey-stage-heading">
                <div className="journey-icon journey-icon-teal"><BarChart3 size={19} strokeWidth={2} /></div>
                <div><span>02</span><h3>Build</h3></div>
              </div>
              <p className="journey-stage-copy">Turn concepts into practical projects and job-ready technical skills.</p>
              <div className="journey-window journey-chart-window">
                <div className="journey-chart-label"><span>Skill progression</span><strong>+24%</strong></div>
                <div className="journey-chart">{bars.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>
                <div className="journey-chart-axis"><span>Start</span><span>Projects</span><span>Ready</span></div>
              </div>
            </article>

            <div className="journey-connector" aria-hidden="true"><span className="journey-connector-dot" /><span className="journey-connector-line" /><ArrowRight size={19} /></div>

            <article className="journey-stage">
              <div className="journey-stage-heading">
                <div className="journey-icon journey-icon-purple"><Target size={19} strokeWidth={2} /></div>
                <div><span>03</span><h3>Grow</h3></div>
              </div>
              <p className="journey-stage-copy">Develop the confidence and career readiness to move forward in the digital economy.</p>
              <div className="journey-window journey-growth-window">
                <div className="growth-ring"><div><Check size={29} strokeWidth={2.5} /></div></div>
                <div className="growth-meta"><span>Career readiness</span><strong>78%</strong></div>
                <div className="growth-progress"><span /></div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
