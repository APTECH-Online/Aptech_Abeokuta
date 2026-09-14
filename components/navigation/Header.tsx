'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, ShieldCheck, MessageCircle, ChevronDown } from 'lucide-react'
import { primaryNav, exploreNav } from '../../data/site'
import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE } from '../../lib/whatsapp'

export default function Header({ whatsapp }: { whatsapp: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const exploreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    setExploreOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!exploreOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) setExploreOpen(false)
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExploreOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [exploreOpen])

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))
  const isExploreActive = exploreNav.some((item) => isActive(item.href))

  return (
    <header
      className="sticky top-0 z-50 bg-white transition-all duration-200"
      style={{
        borderBottom: '1px solid var(--color-line)',
        boxShadow: scrolled ? '0 8px 24px rgba(19,12,46,0.08)' : 'none'
      }}
    >
      <div
        className="container flex items-center justify-between transition-all duration-200"
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

        <nav className="hidden xl:flex items-center gap-1" aria-label="Primary">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className="relative px-3.5 py-2 text-sm font-semibold transition-colors group"
              style={{ color: isActive(item.href) ? 'var(--color-navy-900)' : 'var(--color-body)' }}
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
          ))}

          <div ref={exploreRef} className="relative">
            <button
              type="button"
              onClick={() => setExploreOpen((v) => !v)}
              aria-expanded={exploreOpen}
              aria-haspopup="true"
              className="relative px-3.5 py-2 text-sm font-semibold transition-colors inline-flex items-center gap-1"
              style={{ color: isExploreActive ? 'var(--color-navy-900)' : 'var(--color-body)' }}
            >
              Explore
              <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
            </button>
            {exploreOpen && (
              <div
                className="absolute left-0 top-full mt-1 min-w-[180px] rounded-xl bg-white py-2 z-50"
                style={{ border: '1px solid var(--color-line)', boxShadow: '0 12px 32px rgba(19,12,46,0.14)' }}
              >
                {exploreNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className="block px-4 py-2 text-sm font-medium"
                    style={{ color: isActive(item.href) ? 'var(--color-navy-900)' : 'var(--color-body)' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/admin/login" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium ml-1" style={{ color: 'var(--color-muted)' }}>
            <ShieldCheck size={13} aria-hidden="true" />
            Official Login
          </Link>
          <a
            href={buildWhatsAppLink(whatsapp, WHATSAPP_DEFAULT_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="btn btn-ghost btn-sm ml-2 inline-flex items-center gap-1.5"
          >
            <MessageCircle size={14} aria-hidden="true" />
            Talk to Admissions
          </a>
          <Link href="/admissions" className="btn btn-primary btn-sm ml-2">
            Apply Now
          </Link>
        </nav>

        <button
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="xl:hidden p-2 rounded-md"
          style={{ color: 'var(--color-navy-900)' }}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="xl:hidden bg-white" style={{ borderTop: '1px solid var(--color-line)' }}>
          <nav className="container py-3 flex flex-col" aria-label="Mobile">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className="py-3 text-[0.95rem] font-semibold flex items-center gap-2"
                style={{
                  color: isActive(item.href) ? 'var(--color-navy-900)' : 'var(--color-body)',
                  borderBottom: '1px solid var(--color-line)'
                }}
              >
                {isActive(item.href) && <span className="node-mark" aria-hidden="true" />}
                {item.label}
              </Link>
            ))}
            <p className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
              Explore
            </p>
            {exploreNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className="py-3 text-[0.95rem] font-semibold flex items-center gap-2"
                style={{
                  color: isActive(item.href) ? 'var(--color-navy-900)' : 'var(--color-body)',
                  borderBottom: '1px solid var(--color-line)'
                }}
              >
                {isActive(item.href) && <span className="node-mark" aria-hidden="true" />}
                {item.label}
              </Link>
            ))}
            <Link href="/admissions" className="btn btn-primary btn-block mt-4 mb-2">
              Apply Now
            </Link>
            <a
              href={buildWhatsAppLink(whatsapp, WHATSAPP_DEFAULT_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="btn btn-ghost btn-block mb-2 inline-flex items-center justify-center gap-1.5"
            >
              <MessageCircle size={14} aria-hidden="true" />
              Talk to Admissions
            </a>
            <Link
              href="/admin/login"
              className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium"
              style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-line)' }}
            >
              <ShieldCheck size={13} aria-hidden="true" />
              Official Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
