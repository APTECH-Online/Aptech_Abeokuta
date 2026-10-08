'use client'

import { useCallback, useEffect, useState } from 'react'
import { initParticipant } from '../../app/(site)/tech-playground/actions'
import type { BadgeKey } from '../../data/playground'

const KEY = 'aptech-playground-token'
let memoryToken: string | null = null

function makeToken() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Returns this browser's anonymous participant token (created on first use). */
export function getPlaygroundToken(): string {
  if (memoryToken) return memoryToken
  try {
    let t = localStorage.getItem(KEY)
    if (!t || t.length < 20) { t = makeToken(); localStorage.setItem(KEY, t) }
    memoryToken = t
  } catch { memoryToken = makeToken() }
  return memoryToken
}

export type Streak = { completedDays: number[]; nextDay: number | null; canPlayToday: boolean; finished: boolean; lastCompletedOn: string | null }

export function usePlayground() {
  const [ready, setReady] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [badges, setBadges] = useState<{ key: BadgeKey; awardedAt: string }[]>([])
  const [streak, setStreak] = useState<Streak | null>(null)
  const [token, setToken] = useState('')

  const refresh = useCallback(async () => {
    const t = getPlaygroundToken()
    setToken(t)
    const r = await initParticipant(t)
    if (r.ok) { setDisplayName(r.displayName); setBadges(r.badges as any); setStreak(r.streak as Streak) }
    setReady(true)
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  return { ready, token, displayName, setDisplayName, badges, streak, refresh }
}
