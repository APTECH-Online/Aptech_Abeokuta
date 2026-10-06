'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlarmClock, Bell, BellRing, CalendarClock, CheckCheck, FileText, Repeat, UserPlus } from 'lucide-react'
import { markAllNotificationsRead, markNotificationRead } from '../../app/admin/(dashboard)/notifications/actions'
import type { NotificationType } from '../../types/db'

const POLL_INTERVAL_MS = 30000
const TRAY_LIMIT = 6

interface TrayItem {
  id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  created_at: string
  read: boolean
}

const TYPE_META: Record<NotificationType, { label: string; Icon: typeof Bell }> = {
  'lead.created': { label: 'New enquiry', Icon: UserPlus },
  'lead.resubmitted': { label: 'Repeat enquiry', Icon: Repeat },
  'application.created': { label: 'New application', Icon: FileText },
  'followup.due': { label: 'Follow-up due', Icon: CalendarClock },
  'followup.overdue': { label: 'Follow-up overdue', Icon: AlarmClock }
}

function timeAgo(value: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

/**
 * Topbar bell with an unread counter and a dropdown tray of recent notifications.
 *
 * Data is never hardcoded. The count starts from `initialCount` (the server's
 * unread total for the signed-in staff member) and stays live via:
 *   1. re-syncing whenever the server re-renders the layout with a new count
 *      (e.g. after "Mark as read" revalidates /admin);
 *   2. /api/admin/notifications/recent — fetched on mount, every 30s while the tab
 *      is visible, when the tab regains focus, and each time the tray opens.
 *
 * Each tray item links to its destination (an enquiry, a follow-up, ...) and marks
 * itself read as it is opened. The tray closes on outside click, Escape, focus
 * leaving it, or navigation. The badge is hidden at 0 and shows "99+" above 99.
 */
export default function NotificationBell({ initialCount = 0, enabled = true }: { initialCount?: number; enabled?: boolean }) {
  const [count, setCount] = useState(initialCount)
  const [items, setItems] = useState<TrayItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const trayId = useId()
  const pathname = usePathname()

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/notifications/recent?limit=${TRAY_LIMIT}`, { cache: 'no-store' })
      if (!response.ok) return
      const data = await response.json()
      if (typeof data.count === 'number') setCount(data.count)
      if (Array.isArray(data.items)) setItems(data.items)
      setLoaded(true)
    } catch {
      // Keep the last known state if the background refresh is unavailable.
    }
  }, [])

  // Re-sync when the server hands down a fresh count, and pull the matching list.
  useEffect(() => {
    setCount(initialCount)
    if (loaded) void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCount])

  useEffect(() => {
    if (!enabled) return
    void refresh()
    const poll = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const timer = window.setInterval(poll, POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', poll)
    window.addEventListener('focus', poll)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', poll)
      window.removeEventListener('focus', poll)
    }
  }, [enabled, refresh])

  // Close on navigation.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Close on outside press / Escape.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!enabled) return null

  const unread = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0

  const toggle = () => {
    setOpen((value) => {
      if (!value) void refresh()
      return !value
    })
  }

  const markRead = (item: TrayItem) => {
    if (item.read) return
    // Optimistic: reflect it immediately, then persist. The action revalidates the
    // layout, which re-syncs the count from the server.
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)))
    setCount((c) => Math.max(0, c - 1))
    const data = new FormData()
    data.set('notificationId', item.id)
    void markNotificationRead({ ok: true }, data).then((result) => {
      if (!result.ok) void refresh()
    })
  }

  const markAllRead = () => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })))
    setCount(0)
    void markAllNotificationsRead({ ok: true }, new FormData()).then((result) => {
      if (!result.ok) void refresh()
    })
  }

  return (
    <div
      className="admin-notification"
      ref={wrapRef}
      onBlur={(event) => {
        // Close when keyboard focus leaves the bell + tray entirely.
        if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        type="button"
        ref={buttonRef}
        className={`admin-notification-bell ${open ? 'is-open' : ''}`}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? trayId : undefined}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Bell size={19} aria-hidden="true" />
        {unread > 0 && (
          <span className="admin-notification-badge" aria-hidden="true">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div id={trayId} role="dialog" aria-label="Notifications" className="admin-notification-tray">
          <div className="admin-notification-tray__head">
            <p className="admin-notification-tray__title">
              Notifications
              {unread > 0 && <span className="admin-notification-tray__new">{unread > 99 ? '99+' : unread} new</span>}
            </p>
            {unread > 0 && (
              <button type="button" className="admin-notification-tray__action" onClick={markAllRead}>
                <CheckCheck size={14} aria-hidden="true" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="admin-notification-tray__body">
            {!loaded ? (
              <p className="admin-notification-tray__empty">Loading…</p>
            ) : items.length === 0 ? (
              <div className="admin-notification-tray__empty">
                <BellRing size={22} aria-hidden="true" />
                <p className="font-semibold">You&apos;re all caught up</p>
                <p>New enquiries and follow-ups will appear here.</p>
              </div>
            ) : (
              <ul className="admin-notification-tray__list">
                {items.map((item) => {
                  const meta = TYPE_META[item.type] ?? { label: item.type, Icon: Bell }
                  const Icon = meta.Icon
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.link || '/admin/notifications'}
                        className={`admin-notification-item ${item.read ? '' : 'is-unread'}`}
                        onClick={() => {
                          markRead(item)
                          setOpen(false)
                        }}
                      >
                        <span className="admin-notification-item__icon" aria-hidden="true">
                          <Icon size={16} />
                        </span>
                        <span className="admin-notification-item__text">
                          <span className="admin-notification-item__type">{meta.label}</span>
                          <span className="admin-notification-item__title">{item.title}</span>
                          {item.body && <span className="admin-notification-item__body">{item.body}</span>}
                          <span className="admin-notification-item__time">{timeAgo(item.created_at)}</span>
                        </span>
                        {!item.read && <span className="admin-notification-item__dot" aria-label="Unread" />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <Link href="/admin/notifications" className="admin-notification-tray__foot" onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
