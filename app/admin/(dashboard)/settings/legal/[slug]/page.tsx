import Link from 'next/link'
import { notFound } from 'next/navigation'
import { guardAdminPage, canManageContactInfo } from '../../../../../../lib/auth'
import { hasAnyModulePermission } from '../../../../../../lib/permissions'
import { ensureLegalSeeded, listLegalDocuments } from '../../../../../../lib/crm/legal'
import { LEGAL_LABELS, LEGAL_SLUGS, type LegalSlug } from '../../../../../../data/legal'
import LegalEditor, { StartDraftButton } from '../../../../../../components/admin/LegalEditor'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return { title: `${LEGAL_LABELS[slug as LegalSlug] ?? 'Legal'} | Admissions CRM` }
}

export default async function LegalEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!(LEGAL_SLUGS as string[]).includes(slug)) notFound()
  const staff = await guardAdminPage((s) => s.role === 'super_admin' || hasAnyModulePermission(s, 'website_content'))
  await ensureLegalSeeded()
  const docs = await listLegalDocuments(slug as LegalSlug)
  const draft = docs.find((d) => d.status === 'draft')
  const live = docs.find((d) => d.status === 'published')
  const canEdit = canManageContactInfo(staff)

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/settings/legal" className="text-sm underline" style={{ color: 'var(--color-muted)' }}>← Legal &amp; policies</Link>
        <p className="eyebrow mt-5">Content</p>
        <h1 className="h-section mt-1">{LEGAL_LABELS[slug as LegalSlug]}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
          {live ? `Live version: v${live.version}.` : 'No published version yet.'} {draft ? `Editing draft v${draft.version}.` : ''}
        </p>
      </div>

      <div className="card p-5 sm:p-6">
        {!canEdit ? (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>You have read-only access to this section. Ask a Super Admin for Content Manager access to edit.</p>
        ) : draft ? (
          <LegalEditor
            draft={{
              id: draft.id,
              title: draft.title,
              summary: draft.summary ?? '',
              effective_date: draft.effective_date ?? new Date().toISOString().slice(0, 10),
              change_summary: draft.change_summary ?? '',
              sections: draft.sections
            }}
            canPublish={staff.role === 'super_admin'}
          />
        ) : (
          <div className="grid gap-3 max-w-xl">
            <p className="text-sm" style={{ color: 'var(--color-body)' }}>
              The live version can&apos;t be edited directly, so every change is tracked. Start a new draft to copy it, make your changes, then publish.
            </p>
            <StartDraftButton slug={slug} label="Start a new draft" />
          </div>
        )}
      </div>
    </div>
  )
}
