import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import Container from '../ui/Container'
import IconTile from '../ui/IconTile'
import type { PublicInsight } from '../../lib/insights-public'

/**
 * "Not sure which course to choose?" guide cards for /courses. The whole card is
 * one link (stretched via ::after) so the tap target is large, while the title
 * stays the real, crawlable anchor.
 */
export default function GuideCards({ guides }: { guides: PublicInsight[] }) {
  if (!guides.length) return null
  return (
    <section className="section-tight guide-section">
      <Container>
        <div className="guide-head">
          <p className="eyebrow">Course guides</p>
          <h2 className="h-section mt-2">Not sure which course to choose?</h2>
          <p className="lede mt-3 max-w-2xl">
            These guides explain the options in plain language, and each links to the matching APTECH Abeokuta courses.
            You can also <Link href="/contact" className="guide-head__link">ask the admissions team</Link>.
          </p>
        </div>
        <ul className="guide-grid">
          {guides.map((g, i) => (
            <li key={g.slug} className="guide-card">
              <div className="guide-card__top">
                <IconTile icon={BookOpen} tone={i % 3 === 1 ? 'teal' : i % 3 === 2 ? 'amber' : 'navy'} />
                <span className="guide-card__tag">{g.category || 'Guide'}</span>
              </div>
              <h3 className="guide-card__title">
                <Link href={`/insights/${g.slug}`} className="guide-card__link">{g.title}</Link>
              </h3>
              {g.short_description && <p className="guide-card__desc">{g.short_description}</p>}
              <span className="guide-card__cta" aria-hidden="true">Read the guide <ArrowRight size={15} /></span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
