import { ReactNode } from 'react'

export const metadata = {
  title: {
    default: 'APTECH Abeokuta — Official Administration Portal',
    template: '%s | APTECH Abeokuta CRM'
  },
  robots: { index: false, follow: false }
}

/**
 * Root layout for the entire CRM / staff portal (login + authenticated
 * dashboard). This is intentionally separate from app/(site)/layout.tsx —
 * no public header, footer, or marketing navigation is rendered here.
 * Authenticated pages get their own dashboard chrome via AdminShell,
 * rendered from app/admin/(dashboard)/layout.tsx.
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
