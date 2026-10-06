'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'

const POLL_INTERVAL_MS = 30000

/**
 * Topbar bell with an unread-notification counter.
 *
 * The count is never hardcoded. It starts from `initialCount` (the server-computed
 * unread total from getUnreadNotificationCount, the same value behind the sidebar
 * badge) and stays live in two ways:
 *   1. Whenever the server re-renders the layout with a new `initialCount` — e.g.
 *      after "Mark as read" / "Mark all as read" revalidate /admin — local state is
 *      re-synced to it straight away. (useState alone would keep the stale first value.)
 *   2. A background poll of /api/admin/notifications/unread every 30s, plus an
 *      immediate refresh when the tab becomes visible or the window regains focus,
 *      so new enquiries/applications show up without a page reload.
 *
 * The badge is hidden entirely at 0, and shows "99+" above 99.
 */
export default function NotificationBell({ initialCount = 0, enabled = true }: { initialCount?: number; enabled?: boolean }) {
  const [count, setCount] = useState(initialCount)

  // Re-sync when the server hands down a fresh count.
  useEffect(() => {
    setCount(initialCount)
  }, [initialCount])

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/notifications/unread', { cache: 'no-store' })
      if (!response.ok) return
      const data = await response.json()
      if (typeof data.count === 'number') setCount(data.count)
    } catch {
      // Keep the last known count if the background refresh is unavailable.
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
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

  if (!enabled) return null

  const unread = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0

  return (
    <Link
      href="/admin/notifications"
      className="admin-notification-bell"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      title={unread > 0 ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'Notifications'}
    >
      <Bell size={19} aria-hidden="true" />
      {unread > 0 && (
        <span className="admin-notification-badge" aria-hidden="true">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}
