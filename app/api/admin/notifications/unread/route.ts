import { NextResponse } from 'next/server'
import { getCurrentStaff } from '../../../../../lib/auth'
import { createClient } from '../../../../../lib/supabase/server'
import { getUnreadNotificationCount } from '../../../../../lib/notifications'

export const dynamic = 'force-dynamic'

export async function GET() {
  const staff = await getCurrentStaff()
  if (!staff) return NextResponse.json({ count: 0 }, { status: 401 })

  // Notifications are currently available to Super Admins only. Keep the
  // endpoint aligned with the existing CRM authorization model.
  if (staff.role !== 'super_admin') return NextResponse.json({ count: 0 })

  const supabase = await createClient()
  const count = await getUnreadNotificationCount(supabase, staff)
  return NextResponse.json({ count }, { headers: { 'Cache-Control': 'no-store' } })
}
