import type { AdmissionStatus } from '../types/db'

/**
 * One place that decides what a course's admission status means for the page:
 * the status wording, the primary call-to-action and where it goes.
 *
 * Only destinations that already exist are used (/admissions#apply, /contact),
 * so no status can send a visitor to a page that is not there.
 */
export function admissionUi(status: AdmissionStatus) {
  switch (status) {
    case 'coming_soon':
      return { statusLabel: 'Opening soon', primaryLabel: 'Register your interest', mobileLabel: 'Register your interest', href: '/contact', canApply: false, dot: '#fbbf24', text: '#fcd34d' }
    case 'closed':
      return { statusLabel: 'Applications closed', primaryLabel: 'Ask about the next intake', mobileLabel: 'Ask about the next intake', href: '/contact', canApply: false, dot: '#f87171', text: '#fca5a5' }
    default:
      return { statusLabel: 'Applications open', primaryLabel: 'Enroll now', mobileLabel: 'Apply for this course', href: '/admissions#apply', canApply: true, dot: '#4ade80', text: '#7be0a8' }
  }
}
