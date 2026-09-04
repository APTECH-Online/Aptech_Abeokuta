import './globals.css'
import { ReactNode } from 'react'
import { Sora, Manrope, IBM_Plex_Mono } from 'next/font/google'
import { siteConfig } from '../data/site'

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

export const metadata = {
  title: {
    default: `${siteConfig.name} — Build Your Future with Technology`,
    template: `%s — ${siteConfig.name}`
  },
  description: siteConfig.description,
  icons: '/favicon.svg',
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    images: ['/images/hero-tech.svg']
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com')
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
  return (
    <html lang="en" className={`${sora.variable} ${manrope.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
