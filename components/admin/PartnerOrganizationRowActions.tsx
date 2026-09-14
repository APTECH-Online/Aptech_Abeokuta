'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import {
  togglePartnerOrganizationPublished,
  deletePartnerOrganization,
  type ActionResult
} from '../../app/admin/(dashboard)/settings/partners/organizations/actions'
import type { PartnerOrganization } from '../../types/db'

const initial: ActionResult = { ok: true }

function ToggleForm({ item }: { item: PartnerOrganization }) {
  const [, formAction, pending] = useActionState(togglePartnerOrganizationPublished, initial)
  return (
    <form action={formAction}>
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="nextValue" value={(!item.is_published).toString()} />
      <button type="submit" className="btn btn-ghost btn-sm" disabled={pending}>
        {pending ? 'Updating…' : item.is_published ? 'Unpublish' : 'Publish'}
      </button>
    </form>
  )
}

function DeleteForm({ item }: { item: PartnerOrganization }) {
  const [state, formAction] = useActionState(deletePartnerOrganization, initial)
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm('Permanently delete this partner? This cannot be undone.')) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="itemId" value={item.id} />
      <button type="submit" className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>
        Delete
      </button>
      {!state.ok && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{state.message}</p>}
    </form>
  )
}

export default function PartnerOrganizationRowActions({ item, canManage }: { item: PartnerOrganization; canManage: boolean }) {
  if (!canManage) return null
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link href={`/admin/settings/partners/organizations/${item.id}`} className="btn btn-ghost btn-sm">Edit</Link>
      <ToggleForm item={item} />
      <DeleteForm item={item} />
    </div>
  )
}
