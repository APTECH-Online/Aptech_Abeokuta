import Link from 'next/link'
import Image from 'next/image'
import { siteConfig, footerNav } from '../../data/site'

export default function Footer() {
  return (
    <footer className="pattern-adire" style={{ background: 'var(--color-navy-950)', color: 'rgba(255,255,255,0.65)' }}>
      <div className="container py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-10">
        <div>
          <div className="flex items-center">
            <Image
              src="/images/aptech-logo-footer.png"
              alt="APTECH Computer Education — Abeokuta"
              width={860}
              height={258}
              className="w-auto h-[44px] sm:h-[48px] md:h-[52px] object-contain"
            />
          </div>
          <p className="mt-5 text-sm leading-relaxed max-w-xs">{siteConfig.description}</p>
        </div>

        <div>
          <h2 className="eyebrow eyebrow-inverse">Explore</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {footerNav.explore.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow eyebrow-inverse">Support</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {footerNav.support.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow eyebrow-inverse">Contact</h2>
          <ul className="mt-5 space-y-3 text-sm">
            <li>{siteConfig.address}</li>
            <li>{siteConfig.phone}</li>
            <li>{siteConfig.email}</li>
          </ul>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <p>© {new Date().getFullYear()} APTECH Abeokuta. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
