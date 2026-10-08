import { useId } from 'react'

/**
 * Privacy/terms consent (required) + optional marketing opt-in. Posts
 * `privacyConsent=yes` and, if ticked, `marketingOptIn=yes`. Server actions
 * must re-check `privacyConsent` — never rely on the browser's `required`.
 */
export default function ConsentFields({ error, showMarketing = true, compact = false }: { error?: string; showMarketing?: boolean; compact?: boolean }) {
  const uid = useId()
  return (
    <div className="consent-box" style={compact ? { padding: '.75rem' } : undefined}>
      <label className="consent-row" htmlFor={`${uid}-privacy`}>
        <input id={`${uid}-privacy`} type="checkbox" name="privacyConsent" value="yes" required aria-describedby={error ? `${uid}-err` : undefined} aria-invalid={error ? true : undefined} />
        <span>
          I have read the <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a> and agree to the{' '}
          <a href="/terms" target="_blank" rel="noopener">Terms &amp; Conditions</a>, and I agree that APTECH Abeokuta may use my details to respond to this request. If I am under 18, my parent or guardian knows I am submitting this. <span aria-hidden="true">*</span>
        </span>
      </label>
      {showMarketing && (
        <label className="consent-row" htmlFor={`${uid}-marketing`}>
          <input id={`${uid}-marketing`} type="checkbox" name="marketingOptIn" value="yes" />
          <span>Optional: send me news, events and programme updates by email, WhatsApp or phone. I can opt out at any time.</span>
        </label>
      )}
      {error && <p id={`${uid}-err`} className="consent-error" role="alert">{error}</p>}
    </div>
  )
}
