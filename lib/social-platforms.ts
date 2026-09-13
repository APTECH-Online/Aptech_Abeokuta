// Platform metadata shared between server code (lib/crm/social-links.ts,
// the settings/social server actions) and client components
// (components/admin/SocialLinkForm.tsx). Deliberately has no 'server-only'
// import and no Supabase/auth dependency, so client components can import it
// directly without pulling server-only code into the browser bundle.
//
// Keep in sync with the `social_links_platform_check` constraint in
// migration 0010_social_links.sql and with components/footer/SocialIcons.tsx,
// which renders one icon per value here.
import type { SocialPlatform } from '../types/db'

export const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter_x', label: 'X (Twitter)' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Other' }
]
