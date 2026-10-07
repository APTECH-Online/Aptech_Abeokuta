/**
 * Single source of truth for every map link that points at the Aptech Abeokuta
 * office: the embedded map on /contact, the "Get Directions" actions, and the
 * `hasMap` link in the site's structured data.
 *
 * Nothing here is invented. The office is located from two things the site
 * already treats as verified: its name and the street address stored in the CRM
 * (`contact_info.address`, so edits made in the admin flow straight through to the
 * map). Google resolves "name + full street address" to its own place listing and
 * drops its official marker and info card on it.
 *
 * If you want the pin and directions to be *exact* regardless of how Google
 * interprets the text, copy the values from the office's Google Maps listing into
 * these optional environment variables (see .env.example). When present they are
 * used instead of the text lookup; when absent nothing changes.
 *   APTECH_MAP_PLACE_ID   Google place ID (ChIJ…) for the office listing
 *   APTECH_MAP_LAT / APTECH_MAP_LNG   decimal coordinates of the office
 */

export const OFFICE_NAME = 'Aptech Computer Education Abeokuta'

/** Street level: nearby roads and landmarks stay visible, the office stays identifiable. */
const EMBED_ZOOM = 16

function parseCoordinate(value: string | undefined, limit: number): number | null {
  if (!value || !value.trim()) return null
  const n = Number(value)
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null
}

function readExactLocation(): { placeId: string | null; coords: { lat: number; lng: number } | null } {
  const placeId = process.env.APTECH_MAP_PLACE_ID?.trim() || null
  const lat = parseCoordinate(process.env.APTECH_MAP_LAT, 90)
  const lng = parseCoordinate(process.env.APTECH_MAP_LNG, 180)
  return { placeId, coords: lat !== null && lng !== null ? { lat, lng } : null }
}

/**
 * "Aptech Computer Education Abeokuta, 22 Quarry Road, …, Abeokuta, Nigeria".
 * A leading "#" ("#22 Quarry Road") is dropped because map geocoders read it
 * as a URL fragment / unit marker rather than a house number.
 */
export function officeQuery(address: string): string {
  const street = address.replace(/^\s*#\s*/, '').trim()
  const place = /abeokuta/i.test(street) ? street : `${street}, Abeokuta`
  return `${OFFICE_NAME}, ${place}, Nigeria`
}

/** Source for the embedded map: centred on the office with Google's own marker. */
export function officeEmbedUrl(address: string): string {
  const { coords } = readExactLocation()
  const q = coords ? `${encodeURIComponent(OFFICE_NAME)}@${coords.lat},${coords.lng}` : encodeURIComponent(officeQuery(address))
  return `https://maps.google.com/maps?q=${q}&z=${EMBED_ZOOM}&hl=en&output=embed`
}

/** Opens turn-by-turn navigation to the office in Google Maps (the app on phones that have it). */
export function officeDirectionsUrl(address: string): string {
  const { placeId, coords } = readExactLocation()
  const destination = coords && !placeId ? `${coords.lat},${coords.lng}` : officeQuery(address)
  const params = [`api=1`, `destination=${encodeURIComponent(destination)}`]
  if (placeId) params.push(`destination_place_id=${encodeURIComponent(placeId)}`)
  return `https://www.google.com/maps/dir/?${params.join('&')}`
}

/** Opens the office's listing in Google Maps (used for the `hasMap` structured-data link). */
export function officePlaceUrl(address: string): string {
  const { placeId } = readExactLocation()
  const params = [`api=1`, `query=${encodeURIComponent(officeQuery(address))}`]
  if (placeId) params.push(`query_place_id=${encodeURIComponent(placeId)}`)
  return `https://www.google.com/maps/search/?${params.join('&')}`
}
