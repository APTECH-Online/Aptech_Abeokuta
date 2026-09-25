'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, ShieldCheck, MessageCircle, ChevronDown, ArrowRight, ExternalLink } from 'lucide-react'
import { primaryNav, exploreNav, newsInsightsNav } from '../../data/site'
import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE } from '../../lib/whatsapp'

export default function Header({ whatsapp }: { whatsapp: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [newsOpen, setNewsOpen] = useState(false)
  const exploreRef = useRef<HTMLDivElement>(null)
  const newsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    setExploreOpen(false)
    setNewsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!exploreOpen && !newsOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) setExploreOpen(false)
      if (newsRef.current && !newsRef.current.contains(e.target as Node)) setNewsOpen(false)
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExploreOpen(false)
        setNewsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [exploreOpen, newsOpen])

  const isActive = (href: string) => {
    const path = href.split('?')[0]
    if (path === '/') return pathname === '/'
    return pathname === path || pathname.startsWith(`${path}/`)
  }
  const isExploreActive = exploreNav.some((item) => isActive(item.href))
  const isNewsActive = newsInsightsNav.items.some((item) => isActive(item.href))

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${pathname === '/' ? 'site-header site-header--dark' : 'site-header'}`}
      style={{
        borderBottom: pathname === '/' ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--color-line)',
        boxShadow: pathname === '/' ? (scrolled ? '0 12px 32px rgba(5,4,22,0.34)' : 'none') : (scrolled ? '0 8px 24px rgba(19,12,46,0.08)' : 'none')
      }}
    >
      <div
        className="container flex items-center justify-between transition-all duration-200 site-header__inner"
        style={{ paddingBlock: scrolled ? '0.7rem' : '1.1rem' }}
      >
        <Link href="/" className="flex items-center shrink-0 group" aria-label="APTECH Abeokuta home">
          <Image
            src="/images/aptech-logo-header.png"
            alt="APTECH Computer Education — Abeokuta"
            width={860}
            height={258}
            priority
            className="w-auto h-[44px] sm:h-[48px] md:h-[52px] object-contain"
          />
        </Link>

        <nav className="hidden xl:flex items-center gap-1.5" aria-label="Primary">
          {primaryNav.map((item) => (
            <span key={item.href} className="contents">
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className="relative px-3.5 py-2 text-sm font-semibold transition-colors group"
                style={{ color: pathname === '/' ? (isActive(item.href) ? '#fff' : 'rgba(255,255,255,0.72)') : (isActive(item.href) ? 'var(--color-navy-900)' : 'var(--color-body)') }}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className="absolute left-3.5 right-3.5 -bottom-0.5 h-[2px] origin-left transition-transform duration-200"
                  style={{
                    background: 'var(--color-amber-500)',
                    transform: isActive(item.href) ? 'scaleX(1)' : 'scaleX(0)'
                  }}
                />
                <span
                  aria-hidden="true"
                  className="absolute left-3.5 right-3.5 -bottom-0.5 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200"
                  style={{ background: 'var(--color-line-strong)' }}
                />
              </Link>

              {item.label === 'Events' && (
                <div ref={newsRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setNewsOpen((v) => !v)}
                    aria-expanded={newsOpen}
                    aria-haspopup="true"
                    className="relative px-3.5 py-2 text-sm font-semibold transition-colors inline-flex items-center gap-1"
                    style={{ color: pathname === '/' ? (isNewsActive ? '#fff' : 'rgba(255,255,255,0.72)') : (isNewsActive ? 'var(--color-navy-900)' : 'var(--color-body)') }}
                  >
                    {newsInsightsNav.label}
                    <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${newsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {newsOpen && (
                    <div
                      className={`site-header__explore-menu absolute left-0 top-full mt-2 min-w-[190px] rounded-xl py-2 z-50 ${pathname === '/' ? 'site-header__explore-menu--dark' : ''}`}
                      style={{ border: pathname === '/' ? '1px solid rgba(132,113,232,.32)' : '1px solid var(--color-line)', boxShadow: pathname === '/' ? '0 18px 40px rgba(5,4,22,.38)' : '0 12px 32px rgba(19,12,46,.14)' }}
                    >
                      {newsInsightsNav.items.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          aria-current={isActive(sub.href) ? 'page' : undefined}
                          className="site-header__explore-item block px-4 py-2 text-sm font-medium"
                          style={{ color: pathname === '/' ? (isActive(sub.href) ? '#fff' : 'rgba(255,255,255,.72)') : (isActive(sub.href) ? 'var(--color-navy-900)' : 'var(--color-body)') }}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </span>
          ))}

          <div ref={exploreRef} className="relative">
            <button
              type="button"
              onClick={() => setExploreOpen((v) => !v)}
              aria-expanded={exploreOpen}
              aria-haspopup="true"
              className="relative px-3.5 py-2 text-sm font-semibold transition-colors inline-flex items-center gap-1"
              style={{ color: pathname === '/' ? (isExploreActive ? '#fff' : 'rgba(255,255,255,0.72)') : (isExploreActive ? 'var(--color-navy-900)' : 'var(--color-body)') }}
            >
              Explore
              <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
            </button>
            {exploreOpen && (
              <div
                className={`site-header__explore-menu absolute left-0 top-full mt-2 min-w-[190px] rounded-xl py-2 z-50 ${pathname === '/' ? 'site-header__explore-menu--dark' : ''}`}
                style={{ border: pathname === '/' ? '1px solid rgba(132,113,232,.32)' : '1px solid var(--color-line)', boxShadow: pathname === '/' ? '0 18px 40px rgba(5,4,22,.38)' : '0 12px 32px rgba(19,12,46,.14)' }}
              >
                {exploreNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className="site-header__explore-item block px-4 py-2 text-sm font-medium"
                    style={{ color: pathname === '/' ? (isActive(item.href) ? '#fff' : 'rgba(255,255,255,.72)') : (isActive(item.href) ? 'var(--color-navy-900)' : 'var(--color-body)') }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="site-header__actions">
            <Link
              href="/admin/login"
              className="site-header__login"
              style={{ color: pathname === '/' ? 'rgba(255,255,255,0.72)' : 'var(--color-muted)' }}
            >
              <ShieldCheck size={14} aria-hidden="true" />
              Official Login
            </Link>
            <a
              href={buildWhatsAppLink(whatsapp, WHATSAPP_DEFAULT_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`site-header__contact ${pathname === '/' ? 'site-header__contact--dark' : ''}`}
            >
              <MessageCircle size={14} aria-hidden="true" />
              Talk to Admissions
            </a>
            <Link href="/admissions" className="site-header__apply">
              Apply Now
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </nav>

        <button
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className={`xl:hidden p-2 rounded-md ${pathname === '/' ? 'site-header__menu' : ''}`}
          style={{ color: pathname === '/' ? '#fff' : 'var(--color-navy-900)' }}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className={`xl:hidden ${pathname === '/' ? 'site-header__mobile-nav site-header__mobile-nav--dark' : 'site-header__mobile-nav'}`} style={{ borderTop: pathname === '/' ? '1px solid rgba(255,255,255,.08)' : '1px solid var(--color-line)' }}>
          <nav className="container py-3 flex flex-col" aria-label="Mobile">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className="py-3 text-[0.95rem] font-semibold flex items-center gap-2"
                style={{
                  color: pathname === '/' ? (isActive(item.href) ? '#fff' : 'rgba(255,255,255,.78)') : (isActive(item.href) ? 'var(--color-navy-900)' : 'var(--color-body)'),
                  borderBottom: pathname === '/' ? '1px solid rgba(255,255,255,.08)' : '1px solid var(--color-line)'
                }}
              >
                {isActive(item.href) && <span className="node-mark" aria-hidden="true" />}
                {item.label}
              </Link>
            ))}
            <p className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: pathname === '/' ? 'rgba(255,255,255,.52)' : 'var(--color-muted)' }}>
              {newsInsightsNav.label}
            </p>
            {newsInsightsNav.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className="py-3 text-[0.95rem] font-semibold flex items-center gap-2"
                style={{
                  color: pathname === '/' ? (isActive(item.href) ? '#fff' : 'rgba(255,255,255,.78)') : (isActive(item.href) ? 'var(--color-navy-900)' : 'var(--color-body)'),
                  borderBottom: pathname === '/' ? '1px solid rgba(255,255,255,.08)' : '1px solid var(--color-line)'
                }}
              >
                {isActive(item.href) && <span className="node-mark" aria-hidden="true" />}
                {item.label}
              </Link>
            ))}
            <p className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: pathname === '/' ? 'rgba(255,255,255,.52)' : 'var(--color-muted)' }}>
              Explore
            </p>
            {exploreNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className="py-3 text-[0.95rem] font-semibold flex items-center gap-2"
                style={{
                  color: pathname === '/' ? (isActive(item.href) ? '#fff' : 'rgba(255,255,255,.78)') : (isActive(item.href) ? 'var(--color-navy-900)' : 'var(--color-body)'),
                  borderBottom: pathname === '/' ? '1px solid rgba(255,255,255,.08)' : '1px solid var(--color-line)'
                }}
              >
                {isActive(item.href) && <span className="node-mark" aria-hidden="true" />}
                {item.label}
              </Link>
            ))}
            <div className="site-header__mobile-actions">
              <Link href="/admissions" className="site-header__apply site-header__apply--mobile">
                Apply Now
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <a
                href={buildWhatsAppLink(whatsapp, WHATSAPP_DEFAULT_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="site-header__contact site-header__contact--mobile"
              >
                <MessageCircle size={15} aria-hidden="true" />
                Talk to Admissions
              </a>
              <Link href="/admin/login" className="site-header__login site-header__login--mobile">
                <ShieldCheck size={14} aria-hidden="true" />
                Official Login
                <ExternalLink size={13} aria-hidden="true" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
