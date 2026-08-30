import { NextRequest, NextResponse } from 'next/server'
import { getCurrentStaff, canExportData } from '../../../../lib/auth'
import { getLeads } from '../../../../lib/crm/leads'
import { logAudit } from '../../../../lib/audit'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS, type LeadStatus, type LeadSource } from '../../../../types/db'

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET(request: NextRequest) {
  const staff = await getCurrentStaff()

  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!canExportData(staff.role)) {
    return NextResponse.json({ error: 'You do not have permission to export lead data.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)

  const { leads } = await getLeads({
    search: searchParams.get('search') || undefined,
    status: (searchParams.get('status') as LeadStatus) || '',
    programmeId: searchParams.get('programmeId') || undefined,
    source: (searchParams.get('source') as LeadSource) || '',
    assignedTo: searchParams.get('assignedTo') || undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    page: 1,
    pageSize: 10000
  })

  const headerRow = [
    'Lead Reference',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Programme',
    'Status',
    'Source',
    'Assigned Staff',
    'Created Date'
  ]

  const rows = leads.map((l) => [
    l.lead_reference,
    l.first_name,
    l.last_name,
    l.email,
    l.phone,
    l.programmeName || '',
    LEAD_STATUS_LABELS[l.status],
    LEAD_SOURCE_LABELS[l.source],
    l.assignedName || 'Unassigned',
    new Date(l.created_at).toISOString().slice(0, 10)
  ])

  const csv = [headerRow, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(',')).join('\n')

  try {
    const admin = createAdminClient()
    await logAudit(admin, {
      userId: staff.id,
      action: 'leads.exported',
      entity: 'lead',
      metadata: { count: leads.length, filters: Object.fromEntries(searchParams.entries()) }
    })
  } catch {
    // Audit logging failure shouldn't block the export.
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  })
}
