import { ArrowRight, MapPin } from 'lucide-react'
import IconTile from '../ui/IconTile'
import { OFFICE_NAME, officeDirectionsUrl, officeEmbedUrl } from '../../lib/office-map'

/**
 * Map of the Aptech Abeokuta office for the contact page.
 *
 * The embed is centred on the office with Google's own place marker (which shows
 * the name and address when selected). The caption underneath repeats the name
 * and address in text, so the location never relies on the pin or a colour alone,
 * and carries the Get Directions action beside the map on every screen size —
 * stacked below the map rather than overlaid on it, so it can't cover anything.
 * The caption is also the page's campus-address card (it isn't repeated above).
 */
export default function OfficeMap({ address }: { address: string }) {
  const directionsUrl = officeDirectionsUrl(address)

  return (
    <section aria-label={`Map and directions to ${OFFICE_NAME}`} className="office-map">
      <div className="office-map__frame">
        <iframe
          title={`Map showing ${OFFICE_NAME}, ${address}`}
          src={officeEmbedUrl(address)}
          className="w-full h-full border-0 block"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="office-map__caption">
        <IconTile icon={MapPin} tone="teal" size="md" />
        <div className="min-w-0 flex-1">
          <p className="contact-kicker">Campus address</p>
          <p className="office-map__name">{OFFICE_NAME}</p>
          <p className="office-map__address">{address}</p>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-sm office-map__cta"
          aria-label={`Get directions to ${OFFICE_NAME} in Google Maps (opens in a new tab)`}
        >
          Get Directions <ArrowRight size={15} aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
