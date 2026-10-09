import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { getPublishedAffiliatedUniversities } from '../../lib/partners-public'

/**
 * Affiliated-university cards. Sits inside the broader "Partners & alliances"
 * area alongside the industry-partner write-ups (partner_organizations).
 *
 * Each card is a logo well plus a footer with the university name; when the
 * university has a website the whole card is a link. Logos are staff-managed
 * at /admin/settings/partners/universities and have no known intrinsic size,
 * so they render with next/image `fill` inside a fixed-height well.
 *
 * variant="section"  — standalone block with its own label (About page)
 * variant="embedded" — footer band of the home-page alliance panel
 */
export default async function PartnerLogos({
  showLabel = true,
  variant = 'section'
}: {
  showLabel?: boolean
  variant?: 'section' | 'embedded'
}) {
  const universities = await getPublishedAffiliatedUniversities()
  if (universities.length === 0) return null

  const label = showLabel && (
    <div className="partner-label">
      <p className="eyebrow">Affiliated universities</p>
      <span className="partner-rule" aria-hidden="true" />
    </div>
  )

  const grid = (
    <ul className="uni-grid">
      {universities.map((uni) => {
        const inner = (
          <>
            <div className="uni-logo">
              <Image src={uni.logo_url} alt={`${uni.name} logo`} fill className="object-contain" sizes="(min-width: 768px) 200px, 45vw" />
            </div>
            <div className="uni-foot">
              <span className="uni-name">{uni.name}</span>
              {uni.website_url && <ArrowUpRight className="uni-visit" size={15} strokeWidth={2} aria-hidden="true" />}
            </div>
          </>
        )
        return (
          <li key={uni.id} className="uni-item">
            {uni.website_url ? (
              <a href={uni.website_url} target="_blank" rel="noopener noreferrer" className="uni-card" aria-label={`${uni.name} (opens in a new tab)`}>
                {inner}
              </a>
            ) : (
              <div className="uni-card">{inner}</div>
            )}
          </li>
        )
      })}
    </ul>
  )

  if (variant === 'embedded') {
    return (
      <div className="alliance-foot">
        {label}
        {grid}
      </div>
    )
  }
  return (
    <div className={showLabel ? 'mt-10 sm:mt-12' : 'mt-8'}>
      {label}
      {grid}
    </div>
  )
}
