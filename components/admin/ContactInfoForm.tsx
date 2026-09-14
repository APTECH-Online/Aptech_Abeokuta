'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import FormAlert from '../shared/FormAlert'
import { updateContactInfo, type ActionResult } from '../../app/admin/(dashboard)/settings/contact/actions'
import type { ContactInfo } from '../../types/db'

const initial: ActionResult = { ok: true }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  )
}

/** "Monday – Friday | 9:00 AM – 5:00 PM" per line — see parseHours() in actions.ts. */
function hoursToLines(hours: ContactInfo['hours']): string {
  return hours.map((h) => `${h.day} | ${h.time}`).join('\n')
}

export default function ContactInfoForm({ contactInfo }: { contactInfo: ContactInfo | null }) {
  const [state, formAction] = useActionState(updateContactInfo, initial)
  const fieldErrors = !state.ok ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="grid gap-6 max-w-xl">
      <input type="hidden" name="contactId" value={contactInfo?.id ?? ''} />

      {!state.ok && state.message && <FormAlert variant="error" title={state.message} />}
      {state.ok && state !== initial && <p className="text-sm" style={{ color: 'var(--color-success)' }}>Saved.</p>}

      <div>
        <label htmlFor="phone" className="field-label">Phone</label>
        <input
          id="phone"
          name="phone"
          type="text"
          required
          maxLength={40}
          defaultValue={contactInfo?.phone ?? ''}
          className="admin-input"
          placeholder="+234 (0) 803 415 2557"
        />
        {fieldErrors?.phone && <p className="field-error">{fieldErrors.phone}</p>}
      </div>

      <div>
        <label htmlFor="whatsapp" className="field-label">WhatsApp number</label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="text"
          required
          maxLength={40}
          defaultValue={contactInfo?.whatsapp ?? ''}
          className="admin-input"
          placeholder="+234 (0) 803 415 2557"
        />
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          Used to build every "Chat on WhatsApp" link across the site — the header, the sticky mobile bar, and
          the Contact and Admissions forms. Can be the same as the phone number above.
        </p>
        {fieldErrors?.whatsapp && <p className="field-error">{fieldErrors.whatsapp}</p>}
      </div>

      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={200}
          defaultValue={contactInfo?.email ?? ''}
          className="admin-input"
          placeholder="aptech.abeokuta@gmail.com"
        />
        {fieldErrors?.email && <p className="field-error">{fieldErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="address" className="field-label">Campus address</label>
        <textarea
          id="address"
          name="address"
          required
          rows={2}
          maxLength={500}
          defaultValue={contactInfo?.address ?? ''}
          className="admin-input"
        />
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          Also used for the campus map embed on the Contact page and the site's search-engine listing.
        </p>
        {fieldErrors?.address && <p className="field-error">{fieldErrors.address}</p>}
      </div>

      <div>
        <label htmlFor="hours" className="field-label">Office hours</label>
        <textarea
          id="hours"
          name="hours"
          rows={4}
          defaultValue={contactInfo ? hoursToLines(contactInfo.hours) : ''}
          className="admin-input font-mono text-sm"
          placeholder={'One per line, as Day | Time, e.g.\nMonday – Friday | 9:00 AM – 5:00 PM\nSaturday | 10:00 AM – 2:00 PM\nSunday | Closed'}
        />
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          One row per line, formatted as <code>Day | Time</code>. Up to 7 rows.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <SubmitButton />
      </div>
    </form>
  )
}
