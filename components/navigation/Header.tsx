'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, FocusEvent as ReactFocusEvent } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, ShieldCheck, MessageCircle, ChevronDown, ArrowRight, ExternalLink } from 'lucide-react'
import { primaryNav, campusNav, newsInsightsNav } from '../../data/site'
import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE } from '../../lib/whatsapp'

type NavGroup = { label: string; items: { label: string; href: string }[] }

/**
 * A single "disclosure" style nav dropdown: a button that reveals a list of
 * real links. Deliberately not an ARIA `menu`/`menuitem` widget — for site
 * navigation, a plain list of links inside a show/hide container is the
 * pattern screen reader users actually expect (arrowing through links the
 * same way they would anywhere else), and it avoids the roving-tabindex
 * failure modes of the application-menu pattern. Supports:
 *  - Enter/Space/click on the trigger to toggle
 *  - ArrowDown on the trigger to open and move focus into the list
 *  - ArrowUp/ArrowDown to move between links, Home/End to jump to the ends
 *  - Escape to close and return focus to the trigger
 *  - Click-outside and focus-outside (Tab away) both close the menu
 */
function NavDropdown({
  group,
  id,
  isDark,
  isActive,
  isOpen,
  onOpenChange
}: {
  group: NavGroup
  id: string
  isDark: boolean
  isActive: (href: string) => boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const groupActive = group.items.some((item) => isActive(item.href))
  const panelId = `${id}-panel`
  const buttonId = `${id}-button`

  useEffect(() => {
    if (!isOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onOpenChange(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [isOpen, onOpenChange])

  const focusItem = (index: number) => {
    const count = group.items.length
    const next = ((index % count) + count) % count
    itemRefs.current[next]?.focus()
  }

  const onTriggerKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      onOpenChange(true)
      requestAnimationFrame(() => focusItem(0))
    } else if (e.key === 'Escape' && isOpen) {
      onOpenChange(false)
    }
  }

  const onItemKeyDown = (e: ReactKeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusItem(index + 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusItem(index - 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusItem(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusItem(group.items.length - 1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onOpenChange(false)
      triggerRef.current?.focus()
    }
  }

  // Close the menu once focus leaves the whole dropdown (e.g. Tab away),
  // without fighting the focus move that happens when an item is clicked.
  const onBlur = (e: ReactFocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) onOpenChange(false)
  }

  return (
    <div ref={containerRef} className="relative" onBlur={onBlur}>
      <button
        ref={triggerRef}
        id={buttonId}
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        onKeyDown={onTriggerKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={panelId}
        className="relative px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors inline-flex items-center gap-1"
        style={{ color: isDark ? (groupActive ? '#fff' : 'rgba(255,255,255,0.72)') : (groupActive ? 'var(--color-navy-900)' : 'var(--color-body)') }}
      >
        {group.label}
        <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div
          id={panelId}
          role="group"
          aria-labelledby={buttonId}
          className={`site-header__explore-menu absolute left-0 top-full mt-2 min-w-[200px] rounded-xl py-2 z-50 ${isDark ? 'site-header__explore-menu--dark' : ''}`}
          style={{ border: isDark ? '1px solid rgba(132,113,232,.32)' : '1px solid var(--color-line)', boxShadow: isDark ? '0 18px 40px rgba(5,4,22,.38)' : '0 12px 32px rgba(19,12,46,.14)' }}
        >
          {group.items.map((sub, index) => (
            <Link
              key={sub.href}
              href={sub.href}
              ref={(el) => { itemRefs.current[index] = el }}
              onKeyDown={(e) => onItemKeyDown(e, index)}
              aria-current={isActive(sub.href) ? 'page' : undefined}
              className="site-header__explore-item block px-4 py-2 text-sm font-medium"
              style={{ color: isDark ? (isActive(sub.href) ? '#fff' : 'rgba(255,255,255,.72)') : (isActive(sub.href) ? 'var(--color-navy-900)' : 'var(--color-body)') }}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

/** Mobile drawer counterpart: a labelled, expandable group of links (same
 * expand/collapse + aria-expanded/aria-controls pattern as components/ui/Accordion.tsx),
 * so related pages are grouped and collapsed by default instead of listed flat. */
function MobileNavGroup({
  group,
  id,
  isDark,
  isActive,
  isOpen,
  onToggle
}: {
  group: NavGroup
  id: string
  isDark: boolean
  isActive: (href: string) => boolean
  isOpen: boolean
  onToggle: () => void
}) {
  const panelId = `${id}-mobile-panel`
  const buttonId = `${id}-mobile-button`
  const groupActive = group.items.some((item) => isActive(item.href))
  return (
    <div style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid var(--color-line)' }}>
      <button
        id={buttonId}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full py-3 text-[0.95rem] font-semibold flex items-center justify-between gap-2"
        style={{ color: isDark ? (groupActive ? '#fff' : 'rgba(255,255,255,.78)') : (groupActive ? 'var(--color-navy-900)' : 'var(--color-body)') }}
      >
        <span className="flex items-center gap-2">
          {groupActive && <span className="node-mark" aria-hidden="true" />}
          {group.label}
        </span>
        <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen} className="pb-2 pl-3 flex flex-col">
        {group.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className="py-2.5 text-[0.9rem] font-medium flex items-center gap-2"
            style={{ color: isDark ? (isActive(item.href) ? '#fff' : 'rgba(255,255,255,.7)') : (isActive(item.href) ? 'var(--color-navy-900)' : 'var(--color-muted)') }}
          >
            {isActive(item.href) && <span className="node-mark" aria-hidden="true" />}
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Header({ whatsapp }: { whatsapp: string }) {
  const pathname = usePathname()
  // Keep the global site header visually consistent on every public page.
  // The homepage hero remains dark; the navigation itself uses the same light
  // surface as the rest of the site so it never changes colour unexpectedly.
  const isDark = false
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openMenu, setOpenMenu] = useState<'campus' | 'news' | null>(null)
  const [mobileOpenGroup, setMobileOpenGroup] = useState<'campus' | 'news' | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    setOpenMenu(null)
    setMobileOpenGroup(null)
  }, [pathname])

  useEffect(() => {
    if (!openMenu) return
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [openMenu])

  const isActive = (href: string) => {
    const path = href.split('?')[0]
    if (path === '/') return pathname === '/'
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${isDark ? 'site-header site-header--dark' : 'site-header'}`}
      style={{
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--color-line)',
        boxShadow: isDark ? (scrolled ? '0 12px 32px rgba(5,4,22,0.34)' : 'none') : (scrolled ? '0 8px 24px rgba(19,12,46,0.08)' : 'none')
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

        <nav className="hidden 2xl:flex items-center gap-1" aria-label="Primary">
          {primaryNav.map((item) => (
            <span key={item.href} className="contents">
              {item.label === 'Contact' && (
                <>
                  <NavDropdown
                    group={campusNav}
                    id="campus-nav"
                    isDark={isDark}
                    isActive={isActive}
                    isOpen={openMenu === 'campus'}
                    onOpenChange={(next) => setOpenMenu(next ? 'campus' : null)}
                  />
                  <NavDropdown
                    group={newsInsightsNav}
                    id="news-nav"
                    isDark={isDark}
                    isActive={isActive}
                    isOpen={openMenu === 'news'}
                    onOpenChange={(next) => setOpenMenu(next ? 'news' : null)}
                  />
                </>
              )}
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className="relative px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors group"
                style={{ color: isDark ? (isActive(item.href) ? '#fff' : 'rgba(255,255,255,0.72)') : (isActive(item.href) ? 'var(--color-navy-900)' : 'var(--color-body)') }}
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
            </span>
          ))}

          <div className="site-header__actions">
            <Link
              href="/admin/login"
              className="site-header__login"
              style={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'var(--color-muted)' }}
            >
              <ShieldCheck size={14} aria-hidden="true" />
              Official Login
            </Link>
            <a
              href={buildWhatsAppLink(whatsapp, WHATSAPP_DEFAULT_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`site-header__contact ${isDark ? 'site-header__contact--dark' : ''}`}
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
          className="2xl:hidden p-2 rounded-md site-header__menu"
          style={{ color: isDark ? '#fff' : 'var(--color-navy-900)' }}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className={`2xl:hidden ${isDark ? 'site-header__mobile-nav site-header__mobile-nav--dark' : 'site-header__mobile-nav'}`} style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid var(--color-line)' }}>
          <nav className="container py-3 flex flex-col" aria-label="Mobile">
            {primaryNav.map((item) => (
              <span key={item.href} className="contents">
                {item.label === 'Contact' && (
                  <>
                    <MobileNavGroup
                      group={campusNav}
                      id="campus-nav"
                      isDark={isDark}
                      isActive={isActive}
                      isOpen={mobileOpenGroup === 'campus'}
                      onToggle={() => setMobileOpenGroup((v) => (v === 'campus' ? null : 'campus'))}
                    />
                    <MobileNavGroup
                      group={newsInsightsNav}
                      id="news-nav"
                      isDark={isDark}
                      isActive={isActive}
                      isOpen={mobileOpenGroup === 'news'}
                      onToggle={() => setMobileOpenGroup((v) => (v === 'news' ? null : 'news'))}
                    />
                  </>
                )}
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className="py-3 text-[0.95rem] font-semibold flex items-center gap-2"
                  style={{
                    color: isDark ? (isActive(item.href) ? '#fff' : 'rgba(255,255,255,.78)') : (isActive(item.href) ? 'var(--color-navy-900)' : 'var(--color-body)'),
                    borderBottom: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid var(--color-line)'
                  }}
                >
                  {isActive(item.href) && <span className="node-mark" aria-hidden="true" />}
                  {item.label}
                </Link>
              </span>
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
