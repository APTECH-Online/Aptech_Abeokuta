import Link from 'next/link'
import Image from 'next/image'
import { siteConfig, footerNav } from '../../data/site'

function FacebookGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.8h2.6l.4-3h-3v-1.9c0-.87.24-1.46 1.5-1.46h1.6V4.14C15.9 4.1 14.98 4 13.9 4c-2.24 0-3.78 1.37-3.78 3.88v2.32H7.5v3h2.62V21h3.38z" />
    </svg>
  )
}

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
          {siteConfig.social.facebook && (
            <a
              href={siteConfig.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="APTECH Abeokuta on Facebook"
              className="mt-6 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <FacebookGlyph size={16} />
            </a>
          )}
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
