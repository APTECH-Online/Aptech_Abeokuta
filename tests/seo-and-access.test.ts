import { describe, expect, it } from 'vitest'
import { STATIC_INDEXABLE_PATHS } from '../lib/seo'
import { canDoEventsAction } from '../lib/events-access'

describe('sitemap coverage', () => {
  it('includes the events page', () => {
    expect(STATIC_INDEXABLE_PATHS).toContain('/events')
  })
  it('has no duplicate paths', () => {
    expect(new Set(STATIC_INDEXABLE_PATHS).size).toBe(STATIC_INDEXABLE_PATHS.length)
  })
})

const staff = (role: string, permissions: Record<string, boolean> = {}, is_active = true) => ({ role, permissions, is_active }) as any

describe('canDoEventsAction', () => {
  it('lets a super admin do everything, including delete', () => {
    for (const a of ['view', 'create', 'edit', 'delete', 'export'] as const) expect(canDoEventsAction(staff('super_admin'), a)).toBe(true)
  })
  it('lets an admissions officer manage events but not delete them', () => {
    expect(canDoEventsAction(staff('admissions_officer'), 'export')).toBe(true)
    expect(canDoEventsAction(staff('admissions_officer'), 'delete')).toBe(false)
  })
  it('gives a content manager nothing by default and only what was granted', () => {
    expect(canDoEventsAction(staff('content_manager'), 'view')).toBe(false)
    const granted = staff('content_manager', { 'enquiries.view': true })
    expect(canDoEventsAction(granted, 'view')).toBe(true)
    expect(canDoEventsAction(granted, 'export')).toBe(false)
    expect(canDoEventsAction(granted, 'delete')).toBe(false)
  })
  it('denies deactivated staff', () => {
    expect(canDoEventsAction(staff('super_admin', {}, false), 'view')).toBe(false)
  })
})
