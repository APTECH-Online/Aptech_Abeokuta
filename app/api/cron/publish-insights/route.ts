import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { logAudit } from '../../../../lib/audit'

export const dynamic = 'force-dynamic'

/**
 * Scheduled publishing for the Insights & Events module.
 *
 * This project has no Celery/Redis/background-job infrastructure, and none
 * was found during inspection (see docs/ brief, section 8) — so scheduling
 * is done the way this Next.js/Supabase/Vercel app already does everything
 * else time-based (compare lib/rate-limit.ts's comment about this stack's
 * constraints): a plain route handler, triggered on a schedule by Vercel
 * Cron (see vercel.json), authorized with a shared secret rather than a
 * user session.
 *
 * What it does, every run:
 *   1. Finds `scheduled` insights whose publish_at has passed → publishes them.
 *   2. Finds `published` insights whose expires_at has passed → archives them.
 *
 * Both steps are plain conditional UPDATEs (`eq('status', ...).lte(...)`),
 * so running this twice in a row (or concurrently) is safe: the second run
 * simply matches zero rows for anything the first run already moved.
 */

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // fail closed if not configured
  const header = req.headers.get('authorization')
  return header === `Bearer ${secret}`
}

async function runScheduledPublishing() {
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()

  const { data: toPublish, error: publishSelectError } = await admin
    .from('insights')
    .select('id, title, slug')
    .eq('status', 'scheduled')
    .lte('publish_at', nowIso)

  if (publishSelectError) {
    throw new Error(`Failed to look up scheduled insights: ${publishSelectError.message}`)
  }

  let publishedCount = 0
  if (toPublish && toPublish.length > 0) {
    const ids = toPublish.map((r) => r.id)
    const { error } = await admin.from('insights').update({ status: 'published' }).in('id', ids)
    if (error) throw new Error(`Failed to publish scheduled insights: ${error.message}`)
    publishedCount = ids.length

    await logAudit(admin, {
      action: 'insight.auto_published',
      entity: 'insight',
      metadata: { count: publishedCount, titles: toPublish.map((r) => r.title), trigger: 'cron' }
    })
  }

  const { data: toExpire, error: expireSelectError } = await admin
    .from('insights')
    .select('id, title, slug')
    .eq('status', 'published')
    .not('expires_at', 'is', null)
    .lte('expires_at', nowIso)

  if (expireSelectError) {
    throw new Error(`Failed to look up expired insights: ${expireSelectError.message}`)
  }

  let archivedCount = 0
  if (toExpire && toExpire.length > 0) {
    const ids = toExpire.map((r) => r.id)
    const { error } = await admin.from('insights').update({ status: 'archived' }).in('id', ids)
    if (error) throw new Error(`Failed to archive expired insights: ${error.message}`)
    archivedCount = ids.length

    await logAudit(admin, {
      action: 'insight.auto_archived',
      entity: 'insight',
      metadata: { count: archivedCount, titles: toExpire.map((r) => r.title), trigger: 'cron' }
    })
  }

  if (publishedCount > 0 || archivedCount > 0) {
    revalidatePath('/insights')
    revalidatePath('/insights/news')
    revalidatePath('/insights/blog')
    revalidatePath('/insights/announcements')
    revalidatePath('/insights/events')
    revalidatePath('/')
    revalidatePath('/admin/insights')
    revalidatePath('/admin')
    for (const r of [...(toPublish ?? []), ...(toExpire ?? [])]) {
      revalidatePath(`/insights/${r.slug}`)
    }
  }

  return { publishedCount, archivedCount }
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runScheduledPublishing()
    return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() })
  } catch (err) {
    console.error('[cron] publish-insights failed', err)
    return NextResponse.json({ ok: false, error: 'Scheduled publishing failed. Check server logs.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}
