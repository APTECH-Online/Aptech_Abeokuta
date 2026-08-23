import './globals.css'
import { ReactNode } from 'react'
import Header from '../components/navigation/Header'
import Footer from '../components/footer/Footer'

export const metadata = {
  title: 'APTECH Abeokuta',
  description: 'Professional IT training and career-focused technology education in Abeokuta.',
  icons: '/favicon.svg',
  openGraph: {
    title: 'APTECH Abeokuta',
    description: 'Gain practical IT skills and career-ready training at APTECH Abeokuta.',
    images: ['/images/hero-tech.svg']
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com')
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
