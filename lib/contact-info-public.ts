import 'server-only'
import { cache } from 'react'
import { createAdminClient } from './supabase/admin'
import type { ContactInfo } from '../types/db'

export type PublicContactInfo = Pick<ContactInfo, 'phone' | 'whatsapp' | 'email' | 'address' | 'hours'>

/**
 * Last-resort fallback if contact_info is ever unreadable (migration not
 * yet run, network hiccup, etc). Contact details are core information every
 * page depends on — unlike optional marketing content, this must never
 * render as empty. Mirrors the values migration 0012_contact_info.sql
 * seeds, which were themselves copied from the old siteConfig hardcoded
 * values, so a fresh checkout and a freshly-migrated database show the
 * same thing either way.
 */
const DEFAULT_CONTACT_INFO: PublicContactInfo = {
  phone: '+234 (0) 803 415 2557',
  whatsapp: '+234 (0) 803 415 2557',
  email: 'aptech.abeokuta@gmail.com',
  address: '#22 Quarry Road, Old Savannah Bank Building, Panseke, Ibara, Abeokuta',
  hours: [
    { day: 'Monday – Friday', time: '9:00 AM – 5:00 PM' },
    { day: 'Saturday', time: '10:00 AM – 2:00 PM' },
    { day: 'Sunday', time: 'Closed' }
  ]
}

/**
 * `contact_info` is staff-only under RLS (migration 0012). Runs entirely on
 * the server via the service-role client. Falls back to
 * DEFAULT_CONTACT_INFO rather than throwing or returning nulls, since every
 * consumer (footer, contact page, WhatsApp CTAs, structured data) needs a
 * value to render.
 *
 * Wrapped in React's cache() so the several call sites that all need this
 * on a single page render (root layout for JSON-LD, the site layout for
 * the WhatsApp number, Footer, and the Contact/Admissions pages
 * themselves) share one query instead of hitting Supabase up to four times
 * per request. cache() dedupes by argument identity within a single
 * server-render pass — safe here since this function takes no arguments.
 */
export const getPublicContactInfo = cache(async (): Promise<PublicContactInfo> => {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('contact_info')
      .select('phone, whatsapp, email, address, hours')
      .order('updated_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      if (error) console.error('[contact-info] failed to load contact info', error)
      return DEFAULT_CONTACT_INFO
    }
    return data as PublicContactInfo
  } catch (err) {
    console.error('[contact-info] unexpected error loading contact info', err)
    return DEFAULT_CONTACT_INFO
  }
})
