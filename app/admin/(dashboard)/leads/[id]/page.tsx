import { notFound } from 'next/navigation'
import { getLeadDetail } from '../../../../../lib/crm/lead-detail'
import { getCurrentStaff } from '../../../../../lib/auth'
import StatusBadge from '../../../../../components/admin/StatusBadge'
import {
  StatusChangeForm,
  AssignForm,
  InteractionForm,
  FollowUpForm,
  EditLeadForm,
  StartApplicationForm
} from '../../../../../components/admin/LeadActionForms'
import {
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_PRIORITY_LABELS,
  STUDY_MODE_LABELS,
  INTERACTION_TYPE_LABELS,
  APPLICATION_STATUS_LABELS
} from '../../../../../types/db'

export const metadata = { title: 'Lead profile | Admissions CRM' }
export const dynamic = 'force-dynamic'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function LeadProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [detail, staff] = await Promise.all([getLeadDetail(id), getCurrentStaff()])

  if (!detail) notFound()

  const { lead, education, interests, applications, interactions, followUps, staffOptions, programmeOptions, quizResults } = detail
  const activeProgrammeOptions = programmeOptions.filter((p: any) => p.status === 'active')
  const latestInterest = interests[0]

  // Build a single, chronologically-sorted timeline from all meaningful CRM events.
  const timelineEntries = [
    ...interactions.map((i: any) => ({
      id: `interaction-${i.id}`, date: i.created_at,
      title: i.subject || INTERACTION_TYPE_LABELS[i.type as keyof typeof INTERACTION_TYPE_LABELS],
      description: i.description, actor: i.staff?.full_name || (i.type === 'website' ? 'Website' : 'System')
    })),
    ...followUps.map((f: any) => ({
      id: `followup-${f.id}`, date: f.created_at, title: 'Follow-up scheduled',
      description: `${INTERACTION_TYPE_LABELS[f.type as keyof typeof INTERACTION_TYPE_LABELS] || 'Follow-up'} · due ${formatDateTime(f.due_date)}${f.notes ? ` · ${f.notes}` : ''}`,
      actor: f.staff?.full_name || 'System'
    })),
    ...applications.map((a: any) => ({
      id: `application-${a.id}`, date: a.updated_at || a.created_at,
      title: `Application ${APPLICATION_STATUS_LABELS[a.status as keyof typeof APPLICATION_STATUS_LABELS] || a.status}`,
      description: `${a.application_reference}${a.programmes?.name ? ` · ${a.programmes.name}` : ''}`,
      actor: a.staff?.full_name || 'System'
    })),
    ...quizResults.map((q: any) => ({
      id: `quiz-${q.id}`, date: q.completed_at, title: 'Career discovery quiz completed',
      description: q.result_summary, actor: 'Website'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())


  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Lead profile</p>
          <h1 className="h-section mt-1">{lead.first_name} {lead.last_name}</h1>
          <p className="font-mono text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{lead.lead_reference}</p>
        </div>
        <div className="flex items-center gap-2"><StatusBadge status={lead.priority} label={LEAD_PRIORITY_LABELS[lead.priority]} /><StatusBadge status={lead.status} label={LEAD_STATUS_LABELS[lead.status as keyof typeof LEAD_STATUS_LABELS]} /></div>
      </div>

      <div className="flex flex-wrap gap-2">
        {lead.phone && <a className="btn btn-secondary btn-sm" href={`tel:${lead.phone}`}>Call</a>}
        {(lead.whatsapp || lead.phone) && <a className="btn btn-secondary btn-sm" target="_blank" rel="noreferrer" href={`https://wa.me/${String(lead.whatsapp || lead.phone).replace(/\D/g, '')}`}>WhatsApp</a>}
        {lead.email && <a className="btn btn-secondary btn-sm" href={`mailto:${lead.email}`}>Email</a>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: profile info */}
        <div className="lg:col-span-2 grid gap-6">
          <section className="card p-5 sm:p-6">
            <p className="eyebrow mb-3">Contact</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt style={{ color: 'var(--color-muted)' }}>Email</dt>
                <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{lead.email}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--color-muted)' }}>Phone</dt>
                <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{lead.phone}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--color-muted)' }}>WhatsApp</dt>
                <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{lead.whatsapp || '—'}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--color-muted)' }}>Gender</dt>
                <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{lead.gender || '—'}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--color-muted)' }}>Location</dt>
                <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>
                  {[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || '—'}
                </dd>
              </div>
              <div>
                <dt style={{ color: 'var(--color-muted)' }}>Address</dt>
                <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{lead.address || '—'}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <EditLeadForm lead={lead} />
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <p className="eyebrow mb-3">Programme interest</p>
            {interests.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No programme interest recorded.</p>
            ) : (
              <ul className="grid gap-2">
                {interests.map((i: any) => (
                  <li key={i.id} className="text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>{i.programmes?.name || 'Unspecified'}</span>
                    {i.study_mode && <span style={{ color: 'var(--color-muted)' }}>· {STUDY_MODE_LABELS[i.study_mode as keyof typeof STUDY_MODE_LABELS]}</span>}
                    {i.preferred_intake && <span style={{ color: 'var(--color-muted)' }}>· Intake: {i.preferred_intake}</span>}
                    {i.expected_start_date && <span style={{ color: 'var(--color-muted)' }}>· Start: {formatDate(i.expected_start_date)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {quizResults.length > 0 && (
            <section className="card p-5 sm:p-6">
              <p className="eyebrow mb-3">Career discovery context</p>
              {quizResults.slice(0, 3).map((result: any) => (
                <div key={result.id} className="grid gap-3 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><dt style={{ color: 'var(--color-muted)' }}>Recommended programme</dt><dd className="font-semibold" style={{ color: 'var(--color-ink)' }}>{result.recommended?.name || result.recommended_course_title || '—'}</dd></div>
                    <div><dt style={{ color: 'var(--color-muted)' }}>Secondary recommendation</dt><dd className="font-semibold" style={{ color: 'var(--color-ink)' }}>{result.secondary?.name || result.secondary_course_title || '—'}</dd></div>
                    <div><dt style={{ color: 'var(--color-muted)' }}>Career interest</dt><dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{result.career_interest || '—'}</dd></div>
                    <div><dt style={{ color: 'var(--color-muted)' }}>Goal</dt><dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{result.goal || '—'}</dd></div>
                    <div><dt style={{ color: 'var(--color-muted)' }}>Experience</dt><dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{result.experience_level || '—'}</dd></div>
                    <div><dt style={{ color: 'var(--color-muted)' }}>Completed</dt><dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{formatDateTime(result.completed_at)}</dd></div>
                  </div>
                  <p style={{ color: 'var(--color-body)' }}>{result.result_summary}</p>
                </div>
              ))}
            </section>
          )}

          <section className="card p-5 sm:p-6">
            <p className="eyebrow mb-3">Education</p>
            {education ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt style={{ color: 'var(--color-muted)' }}>Highest qualification</dt>
                  <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{education.highest_qualification || '—'}</dd>
                </div>
                <div>
                  <dt style={{ color: 'var(--color-muted)' }}>Institution</dt>
                  <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{education.institution || '—'}</dd>
                </div>
                <div>
                  <dt style={{ color: 'var(--color-muted)' }}>Graduation year</dt>
                  <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{education.graduation_year || '—'}</dd>
                </div>
                <div>
                  <dt style={{ color: 'var(--color-muted)' }}>Previous IT experience</dt>
                  <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{education.previous_it_experience || '—'}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No education details recorded.</p>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <p className="eyebrow mb-3">Marketing</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt style={{ color: 'var(--color-muted)' }}>Source</dt>
                <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{LEAD_SOURCE_LABELS[lead.source as keyof typeof LEAD_SOURCE_LABELS]}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--color-muted)' }}>Landing page</dt>
                <dd className="font-medium truncate" style={{ color: 'var(--color-ink)' }}>{lead.landing_page || '—'}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--color-muted)' }}>Campaign</dt>
                <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{lead.utm_campaign || '—'}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--color-muted)' }}>UTM source / medium</dt>
                <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>
                  {[lead.utm_source, lead.utm_medium].filter(Boolean).join(' / ') || '—'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="eyebrow">Applications</p>
            </div>
            {applications.length > 0 ? (
              <ul className="grid gap-2 mb-4">
                {applications.map((a: any) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm p-3 rounded-lg" style={{ background: 'var(--color-paper)' }}>
                    <div>
                      <p className="font-mono text-xs font-semibold" style={{ color: 'var(--color-navy-700)' }}>{a.application_reference}</p>
                      <p style={{ color: 'var(--color-body)' }}>{a.programmes?.name}</p>
                    </div>
                    <StatusBadge status={a.status} label={APPLICATION_STATUS_LABELS[a.status as keyof typeof APPLICATION_STATUS_LABELS]} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>No application started yet.</p>
            )}
            <StartApplicationForm
              leadId={lead.id}
              programmes={activeProgrammeOptions}
              defaultProgrammeId={latestInterest?.programme_id ?? undefined}
            />
          </section>

          <section className="card p-5 sm:p-6">
            <p className="eyebrow mb-4">Activity timeline</p>
            {timelineEntries.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No activity recorded yet.</p>
            ) : (
              <div className="timeline">
                {timelineEntries.map((entry) => (
                  <div key={entry.id} className="timeline-item">
                    <p className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>{formatDateTime(entry.date)} · {entry.actor}</p>
                    <p className="font-semibold text-sm mt-0.5" style={{ color: 'var(--color-ink)' }}>{entry.title}</p>
                    {entry.description && <p className="text-sm mt-0.5" style={{ color: 'var(--color-body)' }}>{entry.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column: actions */}
        <div className="grid gap-6 content-start">
          <section className="card p-5 sm:p-6">
            <StatusChangeForm leadId={lead.id} currentStatus={lead.status} />
          </section>

          <section className="card p-5 sm:p-6">
            <AssignForm leadId={lead.id} currentAssignedTo={lead.assigned_to} staffOptions={staffOptions} />
          </section>

          <section className="card p-5 sm:p-6">
            <p className="eyebrow mb-3">Log an interaction</p>
            <InteractionForm leadId={lead.id} />
          </section>

          <section className="card p-5 sm:p-6">
            <p className="eyebrow mb-3">Schedule a follow-up</p>
            <FollowUpForm leadId={lead.id} staffOptions={staffOptions} currentStaffId={staff?.id ?? ''} />
          </section>

          {followUps.length > 0 && (
            <section className="card p-5 sm:p-6">
              <p className="eyebrow mb-3">Follow-up history</p>
              <ul className="grid gap-2">
                {followUps.map((f: any) => (
                  <li key={f.id} className="text-sm p-3 rounded-lg" style={{ background: 'var(--color-paper)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium" style={{ color: 'var(--color-ink)' }}>{formatDateTime(f.due_date)}</span>
                      <StatusBadge status={f.status} label={f.status[0].toUpperCase() + f.status.slice(1)} />
                    </div>
                    {f.notes && <p className="mt-1" style={{ color: 'var(--color-body)' }}>{f.notes}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
