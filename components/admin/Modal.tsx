'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * Generic modal dialog, rendered via a portal into document.body so it can
 * never be clipped or visually distorted by an ancestor's layout (e.g. a
 * table cell) — this is what lets /admin/staff move the "Manage Permissions"
 * editor out of the table row and into an overlay instead.
 *
 * Styling lives in app/globals.css under the `.crm-modal*` rules, sharing
 * the same visual language (and z-index stack) as the existing
 * `.crm-alert*` confirmation dialog in AdminFeedbackProvider. On narrow
 * screens it becomes a bottom sheet instead of a centered dialog.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md'
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="crm-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <div
        className={`crm-modal crm-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crm-modal-title"
        aria-describedby={description ? 'crm-modal-description' : undefined}
      >
        <div className="crm-modal__header">
          <div>
            <h2 id="crm-modal-title" className="crm-modal__title">{title}</h2>
            {description && <p id="crm-modal-description" className="crm-modal__description">{description}</p>}
          </div>
          <button ref={closeRef} type="button" className="crm-modal__close" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <div className="crm-modal__body">{children}</div>
      </div>
    </div>,
    document.body
  )
}
