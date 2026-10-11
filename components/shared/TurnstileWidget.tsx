'use client'

import { useEffect, useRef } from 'react'

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise: Promise<void> | null = null

function loadTurnstile(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('Turnstile failed to load'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

/**
 * Cloudflare Turnstile bot check. Place it INSIDE a <form>: Turnstile adds a hidden
 * `cf-turnstile-response` input there, so the token travels with the normal
 * FormData (server actions) or can be read from `new FormData(form)` (fetch).
 *
 * Renders nothing unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, which matches the
 * server, where verification is skipped without TURNSTILE_SECRET_KEY.
 *
 * Tokens are single-use. Change `resetKey` after each submission (for example the
 * useActionState state object) to remove and re-render the widget for a new token.
 */
export default function TurnstileWidget({
  resetKey,
  action,
  className = 'turnstile-widget'
}: {
  resetKey?: unknown
  action?: string
  className?: string
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let cancelled = false
    let widgetId: string | undefined
    loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetId = window.turnstile.render(containerRef.current, { sitekey: siteKey, action, theme: 'auto' })
      })
      .catch(() => {
        // Blocked script (ad blocker, offline): the server will ask the visitor to retry.
      })
    return () => {
      cancelled = true
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [siteKey, action, resetKey])

  if (!siteKey) return null
  return <div ref={containerRef} className={className} />
}
