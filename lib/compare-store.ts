'use client'

import { useSyncExternalStore } from 'react'

/**
 * Cross-page programme comparison shortlist.
 *
 * Persisted in localStorage so a visitor's picks survive navigating between
 * /courses, course pages and /courses/compare, a refresh, and new tabs. It
 * holds slugs only (no personal data). Every read/write is guarded: storage
 * can be blocked (private mode, disabled cookies), in which case the
 * shortlist silently behaves as an in-memory list for the current page view.
 */
export const COMPARE_MAX = 3
const KEY = 'aptech:compare:v1'
const EVENT = 'aptech:compare-change'
const EMPTY: string[] = []

let memory: string[] = EMPTY
let cache: { raw: string | null; value: string[] } = { raw: null, value: EMPTY }

function clean(input: unknown): string[] {
  if (!Array.isArray(input)) return EMPTY
  const slugs = input.filter((v): v is string => typeof v === 'string' && /^[a-z0-9-]{1,120}$/i.test(v))
  return Array.from(new Set(slugs)).slice(0, COMPARE_MAX)
}

/** Stable snapshot: returns the same array reference until the stored value changes. */
export function getCompareSlugs(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw === cache.raw) return cache.value
    let value = EMPTY
    if (raw) value = clean(JSON.parse(raw))
    cache = { raw, value }
    memory = value
    return value
  } catch {
    return memory
  }
}

export function setCompareSlugs(slugs: string[]) {
  const next = clean(slugs)
  memory = next
  try {
    if (next.length) window.localStorage.setItem(KEY, JSON.stringify(next))
    else window.localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable: keep the in-memory copy */
  }
  window.dispatchEvent(new Event(EVENT))
}

export function addCompareSlug(slug: string): boolean {
  const current = getCompareSlugs()
  if (current.includes(slug)) return true
  if (current.length >= COMPARE_MAX) return false
  setCompareSlugs([...current, slug])
  return true
}

export function removeCompareSlug(slug: string) {
  setCompareSlugs(getCompareSlugs().filter((s) => s !== slug))
}

export function clearCompareSlugs() {
  setCompareSlugs([])
}

function subscribe(callback: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key === KEY || e.key === null) callback() }
  window.addEventListener(EVENT, callback)
  window.addEventListener('storage', onStorage) // other tabs
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener('storage', onStorage)
  }
}

/** Reactive shortlist. Server/first render is empty, so hydration never mismatches. */
export function useCompareSlugs(): string[] {
  return useSyncExternalStore(subscribe, getCompareSlugs, () => EMPTY)
}
