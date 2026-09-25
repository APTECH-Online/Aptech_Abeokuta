'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarClock,
  GraduationCap,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  UserCircle,
  UserCog,
  Bell,
  Newspaper,
  Images,
  BookOpen,
  MessageSquareQuote,
  HelpCircle,
  Share2,
  Handshake,
  Phone,
  ChevronDown,
  ExternalLink
} from 'lucide-react'
import type { Staff } from '../../types/db'
import { STAFF_ROLE_LABELS } from '../../types/db'
import { signOut } from '../../app/admin/actions'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, access: 'super_admin' },
  { href: '/admin/leads', label: 'Enquiries', icon: Users, access: 'admissions' },
  { href: '/admin/applications', label: 'Applications', icon: FileText, access: 'admissions' },
  { href: '/admin/follow-ups', label: 'Follow-ups', icon: CalendarClock, access: 'admissions' },
  { href: '/admin/insights', label: 'News / Blog / Insights', icon: Newspaper, access: 'content' },
  { href: '/admin/gallery', label: 'Gallery', icon: Images, access: 'super_admin' },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen, access: 'super_admin' },
  { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote, access: 'super_admin' },
  { href: '/admin/faqs', label: 'FAQs', icon: HelpCircle, access: 'super_admin' },
  { href: '/admin/settings/social', label: 'Social media', icon: Share2, access: 'super_admin' },
  { href: '/admin/settings/partners', label: 'Partners & alliances', icon: Handshake, access: 'super_admin' },
  { href: '/admin/settings/contact', label: 'Contact info', icon: Phone, access: 'super_admin' },
  { href: '/admin/programmes', label: 'Programmes', icon: GraduationCap, access: 'super_admin' },
  { href: '/admin/staff', label: 'Staff', icon: UserCog, access: 'super_admin' },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3, access: 'super_admin' },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell, access: 'super_admin' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, access: 'super_admin' }
]

export default function AdminShell({
  staff,
  unreadNotifications = 0,
  children
}: {
  staff: Staff
  unreadNotifications?: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // '/admin' and '/admin/settings' need exact matching rather than the
  // startsWith below: '/admin/settings/social' is itself a nav item now, so
  // without this, visiting it would highlight both "Social media" and
  // "Settings" at once.
  const isActive = (href: string) =>
    href === '/admin' || href === '/admin/settings' ? pathname === href : pathname?.startsWith(href)
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (staff.role === 'super_admin') return true
    if (item.access === 'content') return staff.role === 'content_manager' && staff.can_manage_insights
    if (item.access === 'admissions') return staff.role === 'admissions_officer'
    return false
  })
  const currentItem = visibleNavItems.find((item) => isActive(item.href))

  return (
    <div className="admin-shell">
      {open && <div className="admin-overlay lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <Image
                src="/images/aptech-logo-footer.png"
                alt="APTECH Computer Education — Abeokuta"
                width={860}
                height={258}
                className="w-auto h-[30px] object-contain"
              />
            </Link>
            <button
              type="button"
              className="lg:hidden text-white/70 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <p className="admin-sidebar-tag">Admissions CRM · Live</p>
        </div>
        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`admin-nav-link ${isActive(item.href) ? 'is-active' : ''}`}
              >
                <Icon size={17} aria-hidden="true" />
                {item.label}
                {item.href === '/admin/notifications' && unreadNotifications > 0 && (
                  <span
                    className="ml-auto text-[0.65rem] font-semibold rounded-full px-1.5 py-0.5"
                    style={{ background: 'var(--color-primary)', color: 'white' }}
                  >
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <p className="text-[0.65rem] text-white/35 leading-relaxed">Use the profile menu in the top bar to manage your account and sign out.</p>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="lg:hidden text-[var(--color-ink)]"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="admin-topbar-eyebrow">Official Administration Portal</p>
            <p className="admin-topbar-title truncate">{currentItem?.label ?? 'Dashboard'}</p>
          </div>
          {staff.role === 'super_admin' && (
            <Link href="/admin/notifications" className="relative shrink-0" style={{ color: 'var(--color-ink)' }} aria-label="Notifications">
              <Bell size={20} aria-hidden="true" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1.5 -right-1.5 text-[0.6rem] font-semibold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1" style={{ background: 'var(--color-primary)', color: 'white' }}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </Link>
          )}
          <div className="admin-topbar-actions">
            <Link
              href="/"
              className="admin-public-link"
              aria-label="Back to public website"
            >
              <ExternalLink size={15} aria-hidden="true" />
              <span>Back to website</span>
            </Link>
            <div className="admin-profile-wrap">
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className={`admin-profile-trigger ${profileOpen ? 'is-open' : ''}`}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label="Open account menu"
              >
                <span className="admin-avatar admin-avatar-topbar" aria-hidden="true">
                  {staff.full_name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase()}
                </span>
                <span className="admin-profile-trigger-copy">
                  <span className="admin-profile-trigger-name">{staff.full_name}</span>
                  <span className="admin-profile-trigger-role">{STAFF_ROLE_LABELS[staff.role]}</span>
                </span>
                <ChevronDown size={15} className={`admin-profile-chevron ${profileOpen ? 'is-open' : ''}`} aria-hidden="true" />
              </button>
              {profileOpen && (
                <div className="admin-profile-menu" role="menu">
                  <div className="admin-profile-header">
                    <div className="admin-profile-header-avatar">
                      <span className="admin-avatar admin-avatar-menu" aria-hidden="true">
                        {staff.full_name
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="admin-profile-label">Official Account</p>
                      <p className="admin-profile-name">{staff.full_name}</p>
                      <p className="admin-profile-email">{staff.email}</p>
                      <span className="admin-profile-role">{STAFF_ROLE_LABELS[staff.role]}</span>
                    </div>
                  </div>
                  <div className="admin-profile-menu-body">
                    {staff.role === 'super_admin' && (
                      <Link
                        href="/admin/settings"
                        onClick={() => setProfileOpen(false)}
                        className="admin-profile-menu-item"
                        role="menuitem"
                      >
                        <UserCircle size={17} aria-hidden="true" />
                        <span>Profile & settings</span>
                      </Link>
                    )}
                    <form action={signOut}>
                      <button type="submit" className="admin-profile-menu-item is-danger" role="menuitem">
                        <LogOut size={17} aria-hidden="true" />
                        <span>Logout</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}
