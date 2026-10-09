import { Building2, Check, Handshake, type LucideIcon } from 'lucide-react'
import IconTile from '../ui/IconTile'
import type { PartnerOrganization } from '../../types/db'

/**
 * "Industry partners" card on the About page. Content is staff-managed
 * (partner_organizations), so the icon is derived from the title: alliances
 * get a handshake, everything else a building.
 */
function pickIcon(title: string): LucideIcon {
  return /alliance|universit|academ|network/i.test(title) ? Handshake : Building2
}

export default function PartnerCard({ partner }: { partner: Pick<PartnerOrganization, 'title' | 'body' | 'points'> }) {
  return (
    <article className="partner-card">
      <header className="partner-head">
        <IconTile icon={pickIcon(partner.title)} tone="navy" size="lg" />
        <div className="min-w-0">
          <p className="partner-kicker">Industry partner</p>
          <h3 className="partner-title">{partner.title}</h3>
        </div>
      </header>
      <p className="partner-body">{partner.body}</p>
      {partner.points.length > 0 && (
        <ul className="partner-points">
          {partner.points.map((point) => (
            <li key={point} className="partner-point">
              <span className="partner-check" aria-hidden="true"><Check size={13} strokeWidth={2.6} /></span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
