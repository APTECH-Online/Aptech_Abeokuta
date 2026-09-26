'use client'

import { useActionState } from 'react'
import { useAdminFeedback } from './AdminFeedbackProvider'
import { useActionFeedback } from './AdminFeedbackProvider'
import Link from 'next/link'
import { togglePublished, deleteGalleryItem, type ActionResult } from '../../app/admin/(dashboard)/gallery/actions'
import type { GalleryItem } from '../../types/db'

const initial: ActionResult = { ok: true }

function ToggleForm({ item }: { item: GalleryItem }) {
  const [toggleState, formAction, pending] = useActionState(togglePublished, initial)
  useActionFeedback(toggleState, 'Toggle published completed successfully.')
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

function DeleteForm({ item }: { item: GalleryItem }) {
  const { confirm } = useAdminFeedback()
  const [state, formAction] = useActionState(deleteGalleryItem, initial)
  useActionFeedback(state, 'Delete gallery item completed successfully.')
  return (
    <form
      action={formAction}
      onSubmit={async (e) => {
        e.preventDefault()
        const form = e.currentTarget
        const accepted = await confirm({ title: 'Delete gallery item?', message: `Permanently delete \"${item.title}\"? This cannot be undone.`, confirmLabel: 'Delete', danger: true })
        if (accepted) form.requestSubmit()
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

export default function GalleryRowActions({ item, canManage }: { item: GalleryItem; canManage: boolean }) {
  if (!canManage) return null
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link href={`/admin/gallery/${item.id}`} className="btn btn-ghost btn-sm">Edit</Link>
      <ToggleForm item={item} />
      <DeleteForm item={item} />
    </div>
  )
}
