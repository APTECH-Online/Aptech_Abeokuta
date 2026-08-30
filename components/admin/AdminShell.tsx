'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  LogOut
} from 'lucide-react'
import type { Staff } from '../../types/db'
import { STAFF_ROLE_LABELS } from '../../types/db'
import { signOut } from '../../app/admin/actions'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/leads', label: 'Leads', icon: Users },
  { href: '/admin/applications', label: 'Applications', icon: FileText },
  { href: '/admin/follow-ups', label: 'Follow-ups', icon: CalendarClock },
  { href: '/admin/programmes', label: 'Programmes', icon: GraduationCap },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings }
]

export default function AdminShell({ staff, children }: { staff: Staff; children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href))

  return (
    <div className="admin-shell">
      {open && <div className="admin-overlay lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
        <div className="admin-sidebar-brand flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="font-display font-bold text-white text-[0.95rem]">APTECH CRM</span>
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
          <p className="text-sm font-semibold text-white truncate">{staff.full_name}</p>
          <p className="text-xs text-white/50 mt-0.5">{STAFF_ROLE_LABELS[staff.role]}</p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="admin-nav-link !px-0 hover:!bg-transparent hover:!text-amber-300 gap-2">
              <LogOut size={15} aria-hidden="true" /> Sign out
            </button>
          </form>
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
          <Link href="/" className="text-xs" style={{ color: 'var(--color-muted)' }}>
            ← Back to public website
          </Link>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}
