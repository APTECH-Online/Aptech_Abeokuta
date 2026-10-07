import { NextResponse } from 'next/server'
import { requireAnalyticsAccess, getAdmissionsAnalytics, resolveAnalyticsRange } from '../../../../../lib/crm/analytics'

function csv(rows: string[][]) {
  return rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
}

export async function GET(request: Request) {
  try {
    await requireAnalyticsAccess()
    const url = new URL(request.url)
    const range = resolveAnalyticsRange(url.searchParams.get('range') ?? 'this_month', url.searchParams.get('from') ?? undefined, url.searchParams.get('to') ?? undefined)
    const type = url.searchParams.get('type') ?? 'source'
    const data = await getAdmissionsAnalytics(range)
    let rows: string[][]
    let filename: string
    if (type === 'programme') {
      rows = [['Programme','Leads','Interested','Applications','Enrolled','Lead → Application %','Application → Enrollment %','Lead → Enrollment %'], ...data.programmes.map(x=>[x.programme,x.leads.toString(),x.interested.toString(),x.applications.toString(),x.enrolled.toString(),x.leadToApplication?.toString() ?? '',x.applicationToEnrollment?.toString() ?? '',x.leadToEnrollment?.toString() ?? ''])]
      filename = 'programme-performance.csv'
    } else if (type === 'application') {
      rows = [['Metric','Value'],['Leads',data.totals.leads.toString()],['Applications',data.totals.applications.toString()],['Lead → Application %',data.totals.leadToApplication?.toString() ?? ''],['Enrolled',data.totals.enrolled.toString()],['Application → Enrollment %',data.totals.applicationToEnrollment?.toString() ?? '']]
      filename = 'application-conversion.csv'
    } else if (type === 'enrollment') {
      rows = [['Metric','Value'],['Leads',data.totals.leads.toString()],['Applications',data.totals.applications.toString()],['Enrolled',data.totals.enrolled.toString()],['Lead → Enrollment %',data.totals.conversion?.toString() ?? ''],['Application → Enrollment %',data.totals.applicationToEnrollment?.toString() ?? '']]
      filename = 'enrollment-conversion.csv'
    } else if (type === 'lead') {
      rows = [['Source','Leads','Applications','Enrolled','Conversion %'], ...data.sources.map(x=>[x.source,x.leads.toString(),x.applications.toString(),x.enrolled.toString(),x.conversion?.toString() ?? ''])]
      filename = 'lead-performance.csv'
    } else {
      rows = [['Source','Leads','Applications','Enrolled','Conversion %'], ...data.sources.map(x=>[x.source,x.leads.toString(),x.applications.toString(),x.enrolled.toString(),x.conversion?.toString() ?? ''])]
      filename = 'source-performance.csv'
    }
    return new NextResponse(csv(rows), { status: 200, headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${filename}"`, 'cache-control': 'no-store' } })
  } catch {
    return NextResponse.json({ ok: false, message: 'You do not have permission to export analytics.' }, { status: 403 })
  }
}
