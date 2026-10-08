'use client'

import { useId } from 'react'

/**
 * Shared, accessible field group for the "Save your result" lead forms
 * (Tech Zone challenge result + homepage Tech IQ result). Presentation only:
 * field names, values and validation rules are unchanged, so the existing
 * server actions (captureChallengeLead / captureLegacyTechIqLead) work as before.
 */
export function LeadFormFields({ showPreference = false }: { showPreference?: boolean }) {
  const uid = useId()
  const id = (name: string) => `${uid}-${name}`

  return (
    <>
      <div className="lead-form__grid">
        <div className="lead-form__field">
          <label htmlFor={id('name')} className="field-label">Full name <span className="lead-form__req" aria-hidden="true">*</span></label>
          <input id={id('name')} name="name" required maxLength={150} autoComplete="name" className="field-input" placeholder="e.g. Ada Okafor" />
        </div>

        <div className="lead-form__field">
          <label htmlFor={id('email')} className="field-label">Email</label>
          <input id={id('email')} name="email" type="email" maxLength={200} autoComplete="email" inputMode="email" className="field-input" placeholder="you@example.com" aria-describedby={id('contact-help')} />
        </div>

        <div className="lead-form__field">
          <label htmlFor={id('phone')} className="field-label">WhatsApp / phone</label>
          <input id={id('phone')} name="phone" type="tel" maxLength={30} autoComplete="tel" inputMode="tel" className="field-input" placeholder="e.g. 0801 234 5678" aria-describedby={id('contact-help')} />
        </div>

        {showPreference && (
          <div className="lead-form__field">
            <label htmlFor={id('pref')} className="field-label">Preferred follow-up</label>
            <select id={id('pref')} name="communicationPreference" className="field-select" defaultValue="none">
              <option value="none">No preference</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">Phone call</option>
            </select>
          </div>
        )}
      </div>

      <p id={id('contact-help')} className="field-hint lead-form__help">Add at least one way to reach you: an email address or a WhatsApp / phone number.</p>

      <div className="lead-form__consent">
        <input id={id('consent')} type="checkbox" name="consent" value="yes" required />
        <label htmlFor={id('consent')}>I agree that Aptech Abeokuta may use these details to send my challenge result and relevant programme information, as described in the <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>. <span className="lead-form__req" aria-hidden="true">*</span></label>
      </div>
    </>
  )
}

export function LeadFormStatus({ message, tone }: { message: string; tone: 'error' | 'success' }) {
  if (!message) return null
  return (
    <p className={`lead-form__status lead-form__status--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{message}</p>
  )
}
