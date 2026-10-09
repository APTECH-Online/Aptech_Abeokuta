import Link from 'next/link'
import { ArrowRight, Eye, Target } from 'lucide-react'
import Container from '../ui/Container'

/** Mission & Vision on the About page. Light, two-panel layout joined by a "mission → vision" connector. */
export default function MissionVision() {
  return (
    <section className="section mv-section">
      <Container>
        <div className="mv-grid">
          <article className="mv-card mv-card--mission">
            <div className="mv-card__head">
              <span className="mv-card__icon" aria-hidden="true"><Target size={24} strokeWidth={1.8} /></span>
              <p className="mv-card__label">Our mission</p>
            </div>
            <h2 className="mv-card__title">Deliver industry-relevant training and career pathways.</h2>
            <p className="mv-card__body">
              APTECH Abeokuta provides career-focused technology education and practical IT
              training for students at every stage — from complete beginners to those looking
              to sharpen professional IT skills.
            </p>
            <ul className="mv-card__chips" role="list">
              <li>Industry-relevant</li>
              <li>Career pathways</li>
              <li>Every stage</li>
            </ul>
          </article>

          <div className="mv-connector" aria-hidden="true">
            <span className="mv-connector__line" />
            <span className="mv-connector__node"><ArrowRight size={18} strokeWidth={2} /></span>
            <span className="mv-connector__line" />
          </div>

          <article className="mv-card mv-card--vision">
            <div className="mv-card__head">
              <span className="mv-card__icon" aria-hidden="true"><Eye size={24} strokeWidth={1.8} /></span>
              <p className="mv-card__label">Our vision</p>
            </div>
            <h2 className="mv-card__title">Empower students to succeed in the digital economy.</h2>
            <p className="mv-card__body">
              We aim to be a trusted local starting point for a technology career: practical
              enough to build real skill, structured enough to build real confidence.
            </p>
            <ul className="mv-card__chips" role="list">
              <li>Trusted local start</li>
              <li>Real skill</li>
              <li>Real confidence</li>
            </ul>
          </article>
        </div>

        <div className="mv-cta">
          <Link href="/admissions" className="btn btn-primary">See admissions</Link>
        </div>
      </Container>
    </section>
  )
}
