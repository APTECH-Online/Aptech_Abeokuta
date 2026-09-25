'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export type ToastTone = 'success' | 'error' | 'warning'

type Toast = { id: number; tone: ToastTone; message: string }
type ConfirmOptions = { title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }
type ConfirmRequest = ConfirmOptions & { resolve: (value: boolean) => void }

type FeedbackContextValue = {
  toast: (tone: ToastTone, message: string) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)
  const toastId = useRef(0)

  const toast = useCallback((tone: ToastTone, message: string) => {
    const id = ++toastId.current
    setToasts((current) => [...current.filter((item) => item.message !== message), { id, tone, message }].slice(-4))
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4200)
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    setConfirmRequest({ ...options, resolve })
  }), [])

  const closeConfirm = (value: boolean) => {
    confirmRequest?.resolve(value)
    setConfirmRequest(null)
  }

  const value: FeedbackContextValue = {
    toast,
    success: (message) => toast('success', message),
    error: (message) => toast('error', message),
    warning: (message) => toast('warning', message),
    confirm
  }

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="crm-toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((item) => (
          <div key={item.id} className={`crm-toast crm-toast--${item.tone}`} role={item.tone === 'error' ? 'alert' : 'status'}>
            <span className="crm-toast__icon" aria-hidden="true">
              {item.tone === 'success' ? '✓' : item.tone === 'warning' ? '!' : '×'}
            </span>
            <span className="crm-toast__message">{item.message}</span>
            <button type="button" className="crm-toast__close" onClick={() => setToasts((current) => current.filter((toast) => toast.id !== item.id))} aria-label="Dismiss notification">×</button>
          </div>
        ))}
      </div>

      {confirmRequest && (
        <div className="crm-alert-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closeConfirm(false) }}>
          <div className="crm-alert" role="alertdialog" aria-modal="true" aria-labelledby="crm-alert-title" aria-describedby="crm-alert-message">
            <div className={`crm-alert__icon ${confirmRequest.danger ? 'crm-alert__icon--danger' : ''}`} aria-hidden="true">{confirmRequest.danger ? '!' : '?'}</div>
            <h2 id="crm-alert-title" className="crm-alert__title">{confirmRequest.title}</h2>
            <p id="crm-alert-message" className="crm-alert__message">{confirmRequest.message}</p>
            <div className="crm-alert__actions">
              <button type="button" className="btn btn-ghost" onClick={() => closeConfirm(false)}>{confirmRequest.cancelLabel ?? 'Cancel'}</button>
              <button type="button" className={`btn ${confirmRequest.danger ? 'crm-alert__danger-button' : 'btn-primary'}`} autoFocus onClick={() => closeConfirm(true)}>{confirmRequest.confirmLabel ?? 'Continue'}</button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  )
}

export function useAdminFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) throw new Error('useAdminFeedback must be used inside AdminFeedbackProvider')
  return context
}

export function useActionFeedback<T extends { ok: boolean; message?: string }>(state: T, successMessage: string) {
  const { success, error } = useAdminFeedback()
  const previous = useRef(state)
  useEffect(() => {
    if (previous.current === state) return
    previous.current = state
    if (state.ok) success(successMessage)
    else if (state.message) error(state.message)
  }, [state, success, error, successMessage])
}
