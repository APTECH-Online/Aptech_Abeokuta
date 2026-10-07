import { MapPin } from 'lucide-react'
import { OFFICE_NAME, officeDirectionsUrl, officeEmbedUrl } from '../../lib/office-map'

/**
 * Map of the Aptech Abeokuta office for the contact page.
 *
 * The embed is centred on the office with Google's own place marker (which shows
 * the name and address when selected). The caption underneath repeats the name
 * and address in text, so the location never relies on the pin or a colour alone,
 * and carries the Get Directions action beside the map on every screen size —
 * stacked below the map rather than overlaid on it, so it can't cover anything.
 */
export default function OfficeMap({ address }: { address: string }) {
  const directionsUrl = officeDirectionsUrl(address)

  return (
    <section
      aria-label={`Map and directions to ${OFFICE_NAME}`}
      className="mt-4 w-full rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper-alt)' }}
    >
      <div className="w-full aspect-[4/3] sm:aspect-[16/10] min-h-64">
        <iframe
          title={`Map showing ${OFFICE_NAME}, ${address}`}
          src={officeEmbedUrl(address)}
          className="w-full h-full border-0 block"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4"
        style={{ borderTop: '1px solid var(--color-line)' }}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1 basis-56">
          <MapPin aria-hidden="true" className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--color-teal-700)' }} />
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-ink)] text-sm">{OFFICE_NAME}</p>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--color-body)' }}>{address}</p>
          </div>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-sm shrink-0"
          aria-label={`Get directions to ${OFFICE_NAME} in Google Maps (opens in a new tab)`}
        >
          Get Directions <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  )
}
