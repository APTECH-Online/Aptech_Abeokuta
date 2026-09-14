import Image from 'next/image'
import { getPublishedAffiliatedUniversities } from '../../lib/partners-public'

/**
 * Logo grid for our affiliated universities. This sits inside the broader
 * "Partners & alliances" section alongside the Avigo Investment Limited /
 * Middlesex & Portsmouth alliance write-up (see the `partner_organizations`
 * table, rendered in app/(site)/about/page.tsx) — the label here calls out
 * that this specific grid is the affiliated-university logos, distinct from
 * that industry/alliance copy.
 *
 * Logos are staff-managed at /admin/settings/partners/universities (see
 * migration 0011_partners_and_affiliated_universities.sql). Uploaded logos
 * have no known intrinsic width/height, so each renders with next/image's
 * `fill` inside a fixed-size box rather than explicit width/height props.
 */
export default async function PartnerLogos({ showLabel = true }: { showLabel?: boolean }) {
  const universities = await getPublishedAffiliatedUniversities()
  if (universities.length === 0) return null

  return (
    <div>
      {showLabel && <p className="eyebrow">Affiliated universities</p>}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-6 items-center ${showLabel ? 'mt-4' : 'mt-8'}`}>
        {universities.map((uni) => {
          const logo = (
            <div className="relative w-full h-12">
              <Image
                src={uni.logo_url}
                alt={`${uni.name} logo`}
                fill
                className="object-contain"
                sizes="160px"
              />
            </div>
          )
          return (
            <div key={uni.id} className="card flex items-center justify-center p-5 h-24" title={uni.name}>
              {uni.website_url ? (
                <a
                  href={uni.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-full flex items-center justify-center"
                  aria-label={uni.name}
                >
                  {logo}
                </a>
              ) : (
                logo
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
