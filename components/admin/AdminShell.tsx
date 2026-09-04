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
  Bell
} from 'lucide-react'
import type { Staff } from '../../types/db'
import { STAFF_ROLE_LABELS } from '../../types/db'
import { signOut } from '../../app/admin/actions'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/leads', label: 'Enquiries', icon: Users },
  { href: '/admin/applications', label: 'Applications', icon: FileText },
  { href: '/admin/follow-ups', label: 'Follow-ups', icon: CalendarClock },
  { href: '/admin/programmes', label: 'Programmes', icon: GraduationCap },
  { href: '/admin/staff', label: 'Staff', icon: UserCog },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: Settings }
]

export default function AdminShell({ staff, children }: { staff: Staff; children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href))
  const currentItem = NAV_ITEMS.find((item) => isActive(item.href))

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
          {NAV_ITEMS.map((item) => {
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
              </Link>
            )
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <span className="admin-avatar" aria-hidden="true">
            {staff.full_name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0])
              .join('')
              .toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold tracking-wider uppercase text-white/35 mb-1">Official Account</p>
            <p className="text-sm font-semibold text-white truncate">{staff.full_name}</p>
            <p className="text-xs text-white/50 mt-0.5">{STAFF_ROLE_LABELS[staff.role]}</p>
            <Link
              href="/admin/settings"
              onClick={() => setOpen(false)}
              className="admin-nav-link !px-0 hover:!bg-transparent hover:!text-white mt-3 gap-2"
            >
              <UserCircle size={15} aria-hidden="true" /> Profile
            </Link>
            <form action={signOut}>
              <button type="submit" className="admin-nav-link !px-0 hover:!bg-transparent hover:!text-amber-300 gap-2">
                <LogOut size={15} aria-hidden="true" /> Logout
              </button>
            </form>
          </div>
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
          <span className="admin-avatar hidden sm:flex" style={{ width: 32, height: 32, fontSize: '0.7rem' }} aria-hidden="true">
            {staff.full_name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0])
              .join('')
              .toUpperCase()}
          </span>
          <Link href="/" className="text-xs shrink-0" style={{ color: 'var(--color-muted)' }}>
            ← Back to public website
          </Link>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}
