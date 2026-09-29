'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'

export default function NotificationBell({ initialCount = 0, enabled = true }: { initialCount?: number; enabled?: boolean }) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    if (!enabled) return
    let active = true
    const refresh = async () => {
      try {
        const response = await fetch('/api/admin/notifications/unread', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        if (active && typeof data.count === 'number') setCount(data.count)
      } catch {
        // Keep the last known count if the background refresh is unavailable.
      }
    }
    const timer = window.setInterval(refresh, 30000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <Link
      href="/admin/notifications"
      className="admin-notification-bell"
      aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
      title={count > 0 ? `${count} unread notification${count === 1 ? '' : 's'}` : 'Notifications'}
    >
      <Bell size={19} aria-hidden="true" />
      {count > 0 && (
        <span className="admin-notification-badge" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
