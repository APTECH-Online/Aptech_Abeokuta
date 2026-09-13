import { ComponentType } from 'react'
import { Globe } from 'lucide-react'
import type { SocialPlatform } from '../../types/db'

// lucide-react (the icon set already used across this project) intentionally
// ships no trademarked brand/logo icons, so each known platform gets a small
// hand-drawn, single-color pictogram here instead — same visual weight
// (24x24 viewbox, currentColor fill) as the rest of the site's iconography.
// 'other' falls back to lucide's Globe icon.

function Facebook({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.8h2.6l.4-3h-3v-1.9c0-.87.24-1.46 1.5-1.46h1.6V4.14C15.9 4.1 14.98 4 13.9 4c-2.24 0-3.78 1.37-3.78 3.88v2.32H7.5v3h2.62V21h3.38z" />
    </svg>
  )
}

function Instagram({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.15" cy="6.85" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TwitterX({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 4l7.2 9.1L4.4 20h1.8l6.1-6.1L17 20h3l-7.5-9.5L19.6 4h-1.8l-5.7 5.7L7 4H4z" />
    </svg>
  )
}

function LinkedIn({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8" cy="8.3" r="1.35" />
      <rect x="6.9" y="10.8" width="2.2" height="7" />
      <path d="M12.4 10.8h2.1v1.1c.5-.75 1.35-1.3 2.5-1.3 1.9 0 3 1.25 3 3.6v4.6h-2.2v-4.2c0-1.1-.4-1.85-1.4-1.85-.75 0-1.2.5-1.4 1-.07.18-.09.42-.09.66v4.4h-2.2c0-.03.03-6.87 0-7.9z" />
    </svg>
  )
}

function YouTube({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="2.5" y="6" width="19" height="12" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.3 9.6l5 2.4-5 2.4z" />
    </svg>
  )
}

function TikTok({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M15.5 3.5c.4 2 1.8 3.4 3.9 3.6v2.6c-1.4 0-2.7-.4-3.9-1.2v6.1c0 3-2.2 5.4-5.4 5.4-3 0-5.2-2.3-5.2-5.2 0-2.9 2.3-5.2 5.2-5.2.35 0 .68.03 1 .1v2.7a2.6 2.6 0 0 0-1-.2c-1.5 0-2.6 1.1-2.6 2.6 0 1.5 1.1 2.6 2.6 2.6 1.6 0 2.8-1.2 2.8-2.9V3.5h2.6z" />
    </svg>
  )
}

function WhatsApp({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3.5a8.4 8.4 0 0 0-7.2 12.7L3.5 20.5l4.4-1.25A8.4 8.4 0 1 0 12 3.5zm0 1.8a6.6 6.6 0 0 1 5.4 10.4 6.6 6.6 0 0 1-9.8 1.5l-.3-.2-2.5.7.7-2.4-.2-.3A6.6 6.6 0 0 1 12 5.3zm-2.9 3.4c-.2 0-.5.05-.7.35-.25.3-.9.9-.9 2.15s.9 2.5 1 2.65c.15.15 1.8 2.75 4.4 3.75 2.15.85 2.6.68 3.05.65.45-.05 1.5-.6 1.7-1.2.2-.6.2-1.1.15-1.2-.06-.1-.2-.16-.45-.3-.25-.15-1.5-.75-1.75-.83-.25-.1-.4-.15-.6.15-.2.3-.68.83-.83 1-.15.15-.3.18-.55.05-.25-.15-1.1-.4-2.1-1.3-.78-.68-1.3-1.55-1.45-1.8-.15-.3 0-.4.12-.55.1-.13.25-.3.35-.45.1-.15.15-.25.2-.4.05-.15.02-.3-.02-.45-.06-.15-.6-1.5-.85-2.05-.2-.5-.45-.45-.6-.45z" />
    </svg>
  )
}

const ICONS: Record<SocialPlatform, ComponentType<{ size?: number }>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter_x: TwitterX,
  linkedin: LinkedIn,
  youtube: YouTube,
  tiktok: TikTok,
  whatsapp: WhatsApp,
  other: Globe
}

export function SocialIcon({ platform, size = 16 }: { platform: SocialPlatform; size?: number }) {
  const Icon = ICONS[platform] ?? Globe
  return <Icon size={size} />
}

export const SOCIAL_PLATFORM_DEFAULT_LABEL: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter_x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  other: 'Website'
}
