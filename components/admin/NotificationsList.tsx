'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { BellRing, CheckCheck } from 'lucide-react'
import { markNotificationRead, markAllNotificationsRead, type ActionResult } from '../../app/admin/(dashboard)/notifications/actions'
import type { Notification, NotificationType } from '../../types/db'

const initial: ActionResult = { ok: true }

const TYPE_LABELS: Record<NotificationType, string> = {
  'lead.created': 'New enquiry',
  'lead.resubmitted': 'Repeat enquiry',
  'application.created': 'New application',
  'followup.due': 'Follow-up due',
  'followup.overdue': 'Follow-up overdue'
}

function formatWhen(value: string): string {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function MarkReadButton({ notificationId }: { notificationId: string }) {
  const [, formAction, pending] = useActionState(markNotificationRead, initial)
  return (
    <form action={formAction}>
      <input type="hidden" name="notificationId" value={notificationId} />
      <button type="submit" className="btn btn-ghost btn-sm" disabled={pending}>
        {pending ? 'Marking…' : 'Mark as read'}
      </button>
    </form>
  )
}

function MarkAllReadButton() {
  const [, formAction, pending] = useActionState(markAllNotificationsRead, initial)
  return (
    <form action={formAction}>
      <button type="submit" className="btn btn-secondary btn-sm gap-2" disabled={pending}>
        <CheckCheck size={15} aria-hidden="true" />
        {pending ? 'Marking…' : 'Mark all as read'}
      </button>
    </form>
  )
}

export default function NotificationsList({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return (
      <section className="card p-8 sm:p-10 text-center grid gap-3 justify-items-center">
        <BellRing size={28} style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
        <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>Nothing here yet</p>
        <p className="text-sm max-w-sm" style={{ color: 'var(--color-muted)' }}>
          New enquiries, applications, and overdue follow-ups will show up here as they happen.
        </p>
      </section>
    )
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </p>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      <ul className="grid gap-2">
        {notifications.map((n) => {
          const isUnread = !n.read_at
          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                    {TYPE_LABELS[n.type] ?? n.type}
                  </p>
                  <p className="font-semibold mt-0.5" style={{ color: 'var(--color-ink)' }}>{n.title}</p>
                  {n.body && (
                    <p className="text-sm mt-1" style={{ color: 'var(--color-body)' }}>{n.body}</p>
                  )}
                  <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>{formatWhen(n.created_at)}</p>
                </div>
                {isUnread && (
                  <span
                    className="shrink-0 mt-1"
                    style={{ width: 8, height: 8, borderRadius: '999px', background: 'var(--color-primary)' }}
                    aria-label="Unread"
                  />
                )}
              </div>
            </>
          )

          return (
            <li
              key={n.id}
              className="card p-4 sm:p-5"
              style={isUnread ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary-050, transparent)' } : undefined}
            >
              {n.link ? (
                <Link href={n.link} className="block hover:opacity-80">
                  {body}
                </Link>
              ) : (
                body
              )}
              {isUnread && (
                <div className="mt-3">
                  <MarkReadButton notificationId={n.id} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
