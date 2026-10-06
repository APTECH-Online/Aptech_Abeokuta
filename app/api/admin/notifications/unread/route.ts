import { NextResponse } from 'next/server'
import { getCurrentStaff } from '../../../../../lib/auth'
import { createClient } from '../../../../../lib/supabase/server'
import { getUnreadNotificationCount } from '../../../../../lib/notifications'

export const dynamic = 'force-dynamic'

export async function GET() {
  const staff = await getCurrentStaff()
  if (!staff) return NextResponse.json({ count: 0 }, { status: 401 })

  // Every active staff member gets their own count: getUnreadNotificationCount
  // only counts what was delivered to them (broadcasts, their role, or direct).
  const supabase = await createClient()
  const count = await getUnreadNotificationCount(supabase, staff)
  return NextResponse.json({ count }, { headers: { 'Cache-Control': 'no-store' } })
}
