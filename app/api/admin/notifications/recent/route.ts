import { NextResponse } from 'next/server'
import { getCurrentStaff } from '../../../../../lib/auth'
import { createClient } from '../../../../../lib/supabase/server'
import { getNotificationsForStaff } from '../../../../../lib/notifications'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 6
const MAX_LIMIT = 10

/**
 * Feeds the topbar bell tray: the unread total plus the most recent
 * notifications delivered to the signed-in staff member (broadcasts, their role,
 * or addressed to them — see isNotificationForStaff). Read and unread items are
 * both returned so the tray shows recent activity, not just what is outstanding.
 */
export async function GET(request: Request) {
  const staff = await getCurrentStaff()
  if (!staff) return NextResponse.json({ count: 0, items: [] }, { status: 401 })

  const requested = Number(new URL(request.url).searchParams.get('limit'))
  const limit = Number.isFinite(requested) && requested > 0 ? Math.min(Math.floor(requested), MAX_LIMIT) : DEFAULT_LIMIT

  const supabase = await createClient()
  const all = await getNotificationsForStaff(supabase, staff, 1000)

  return NextResponse.json(
    {
      count: all.filter((n) => !n.read_at).length,
      items: all.slice(0, limit).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        created_at: n.created_at,
        read: Boolean(n.read_at)
      }))
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
