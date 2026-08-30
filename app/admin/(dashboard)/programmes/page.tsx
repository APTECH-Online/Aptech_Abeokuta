import { createClient } from '../../../../lib/supabase/server'
import { requireStaff, canManageProgrammes } from '../../../../lib/auth'
import type { Programme } from '../../../../types/db'
import { CreateProgrammeForm, EditProgrammeForm, ToggleProgrammeStatusForm } from '../../../../components/admin/ProgrammeForms'
import StatusBadge from '../../../../components/admin/StatusBadge'

export const metadata = { title: 'Programmes | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function ProgrammesPage() {
  const staff = await requireStaff()
  const supabase = await createClient()
  const { data } = await supabase.from('programmes').select('*').order('display_order', { ascending: true })
  const programmes = (data ?? []) as Programme[]
  const canManage = canManageProgrammes(staff.role)

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="h-section mt-1">Programmes</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            Programmes shown here are the same options offered on the public admissions form. Deactivating a
            programme hides it from new applications without touching historical records.
          </p>
        </div>
        {canManage && <CreateProgrammeForm />}
      </div>

      <div className="grid gap-4">
        {programmes.map((p) => (
          <div key={p.id} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-semibold" style={{ color: 'var(--color-ink)' }}>{p.name}</p>
                  <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--color-navy-50)', color: 'var(--color-navy-700)' }}>{p.code}</span>
                  <StatusBadge status={p.status} label={p.status === 'active' ? 'Active' : 'Inactive'} />
                </div>
                {p.duration && <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>{p.duration}</p>}
                {p.description && <p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--color-body)' }}>{p.description}</p>}
              </div>
              {canManage && (
                <div className="flex gap-2 shrink-0">
                  <EditProgrammeForm programme={p} />
                  <ToggleProgrammeStatusForm programme={p} />
                </div>
              )}
            </div>
          </div>
        ))}
        {programmes.length === 0 && (
          <div className="card p-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
            No programmes yet. Run supabase/seed.sql or add one above.
          </div>
        )}
      </div>
    </div>
  )
}
