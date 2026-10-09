import './globals.css'
import { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { Sora, Manrope, IBM_Plex_Mono } from 'next/font/google'
import { siteConfig } from '../data/site'
import { DEFAULT_OG_IMAGE, SITE_LOCALE, getSiteUrl } from '../lib/seo'
import { AdminFeedbackProvider } from '../components/admin/AdminFeedbackProvider'

const sora = Sora({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap'
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap'
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap'
})

/**
 * Site-wide defaults. Every public page sets its own complete title,
 * description, canonical and social metadata through buildMetadata()
 * (lib/seo.ts); these values only apply to routes that don't, and supply
 * metadataBase so relative canonical / Open Graph URLs resolve to absolute ones.
 *
 * Search Console: set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the token Google
 * gives you and the verification meta tag is emitted; leave it unset and no
 * tag is rendered. (DNS verification needs no code at all.)
 */
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteConfig.name} | Computer & IT Training in Abeokuta, Ogun State`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  icons: '/favicon.svg',
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    locale: SITE_LOCALE,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [DEFAULT_OG_IMAGE]
  },
  twitter: {
    card: 'summary_large_image',
    images: [DEFAULT_OG_IMAGE.url]
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {})
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Required for env(safe-area-inset-*) to be non-zero on notched / home-indicator devices.
  viewportFit: 'cover',
  themeColor: '#0B1747'
}

/**
 * True app root. Deliberately minimal: it only sets up fonts and global
 * CSS. Chrome (header/footer for the public site, or the CRM shell for
 * /admin) is added by each section's own nested layout, so the two
 * experiences never leak into each other. See:
 *   - app/(site)/layout.tsx  → public marketing site
 *   - app/admin/layout.tsx   → CRM / staff portal
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  // Organization/WebSite JSON-LD is rendered by app/(site)/layout.tsx, so it
  // appears on public pages only — not on the staff CRM or error shells.
  return (
    <html lang="en-NG" className={`${sora.variable} ${manrope.variable} ${plexMono.variable}`}>
      <body>
        <AdminFeedbackProvider>{children}</AdminFeedbackProvider>
      </body>
    </html>
  )
}
