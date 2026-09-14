import Link from 'next/link'
import Image from 'next/image'
import { siteConfig, footerNav } from '../../data/site'
import { getPublishedSocialLinks } from '../../lib/social-links-public'
import { getPublicContactInfo } from '../../lib/contact-info-public'
import { SocialIcon, SOCIAL_PLATFORM_DEFAULT_LABEL } from './SocialIcons'

// Same underline mechanic as the header nav (components/navigation/Header.tsx):
// an absolutely-positioned bar under the label, hidden at rest and scaled in
// from the left on hover, with a matching transition. The header's hover bar
// uses --color-line-strong, a warm tan tuned for its white background; the
// footer sits on --color-navy-950, so it reuses --color-amber-400 — the same
// accent already used for footer/dark-surface headings (.eyebrow-inverse) and
// hover states (.btn-accent) elsewhere on the site.
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="relative inline-block py-0.5 group hover:text-white transition-colors">
      {children}
      <span
        aria-hidden="true"
        className="absolute left-0 right-0 -bottom-0.5 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200"
        style={{ background: 'var(--color-amber-400)' }}
      />
    </Link>
  )
}

export default async function Footer() {
  const socialLinks = await getPublishedSocialLinks()
  const contactInfo = await getPublicContactInfo()

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
          {socialLinks.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {socialLinks.map((link) => {
                const label = link.label || SOCIAL_PLATFORM_DEFAULT_LABEL[link.platform]
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`APTECH Abeokuta on ${label}`}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <SocialIcon platform={link.platform} size={16} />
                  </a>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="eyebrow eyebrow-inverse">Explore</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {footerNav.explore.map((l) => (
              <li key={l.href}>
                <FooterLink href={l.href}>{l.label}</FooterLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow eyebrow-inverse">Support</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {footerNav.support.map((l) => (
              <li key={l.href}>
                <FooterLink href={l.href}>{l.label}</FooterLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow eyebrow-inverse">Contact</h2>
          <ul className="mt-5 space-y-3 text-sm">
            <li>{contactInfo.address}</li>
            <li>{contactInfo.phone}</li>
            <li>{contactInfo.email}</li>
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
