'use client'

import ConsentFields from '../shared/ConsentFields'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import IconTile from '../ui/IconTile'
import { useActionFeedback } from '../admin/AdminFeedbackProvider'
import FormAlert from '../shared/FormAlert'
import WhatsAppButton from '../shared/WhatsAppButton'
import { submitContactMessage, type SubmitContactState } from '../../app/(site)/contact/actions'

const initialState: SubmitContactState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn btn-primary btn-block sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 size={17} className="animate-spin" aria-hidden="true" />
          Sending…
        </>
      ) : (
        <>
          Send message
          <Send size={16} aria-hidden="true" />
        </>
      )}
    </button>
  )
}

export default function ContactForm({ whatsapp }: { whatsapp: string }) {
  const [state, formAction] = useActionState(submitContactMessage, initialState)
  useActionFeedback(state, 'Message sent successfully.')
  const formRef = useRef<HTMLFormElement>(null)
  const fieldErrors = state.status === 'error' ? state.fieldErrors ?? {} : {}
  const errorClass = (field: string) => (fieldErrors[field] ? 'field-error' : '')

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset()
      document.getElementById('contact-form-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="grid gap-5" noValidate>
      {/* Honeypot — hidden from real visitors via CSS, not display:none, so simple bots that skip hidden fields still get caught less reliably; kept minimal and off-screen */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="contact-companyWebsite">Leave this field empty</label>
        <input id="contact-companyWebsite" name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === 'success' ? (
        <div id="contact-form-result" className="form-success" role="status">
          <IconTile icon={CheckCircle2} tone="teal" size="lg" />
          <h3 className="form-success__title">Message sent</h3>
          <p className="form-success__text">Thanks for reaching out. We typically respond within one to two business days.</p>
        </div>
      ) : (
        <>
          {state.status === 'error' && !state.fieldErrors && (
            <div id="contact-form-result">
              <FormAlert variant="error" title="We couldn't send your message">
                <p>{state.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <WhatsAppButton
                    whatsapp={whatsapp}
                    variant="secondary"
                    label="Contact Admissions"
                    message="Hi APTECH Abeokuta, I tried to send a message on your website but it didn't go through. Can you help?"
                    contextLabel="Contact page enquiry"
                  />
                </div>
              </FormAlert>
            </div>
          )}
          {state.status === 'error' && state.fieldErrors && (
            <div id="contact-form-result">
              <FormAlert variant="error" title="We couldn't send your message">
                <p>{state.message}</p>
              </FormAlert>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="contact-name" className="field-label">Name <span className="field-req" aria-hidden="true">*</span></label>
              <input id="contact-name" name="name" required className={`field-input ${errorClass('name')}`} placeholder="Your name" />
              {fieldErrors.name && <p className="field-error-text">{fieldErrors.name}</p>}
            </div>
            <div>
              <label htmlFor="contact-email" className="field-label">Email <span className="field-req" aria-hidden="true">*</span></label>
              <input id="contact-email" name="email" type="email" required className={`field-input ${errorClass('email')}`} placeholder="you@example.com" />
              {fieldErrors.email && <p className="field-error-text">{fieldErrors.email}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="contact-phone" className="field-label">Phone number <span className="field-req" aria-hidden="true">*</span></label>
              <input id="contact-phone" name="phone" type="tel" required className={`field-input ${errorClass('phone')}`} placeholder="e.g. 080X XXX XXXX" />
              {fieldErrors.phone && <p className="field-error-text">{fieldErrors.phone}</p>}
            </div>
            <div>
              <label htmlFor="contact-subject" className="field-label">Subject</label>
              <input id="contact-subject" name="subject" className="field-input" placeholder="What is this about?" />
            </div>
          </div>
          <div>
            <label htmlFor="contact-message" className="field-label">Message <span className="field-req" aria-hidden="true">*</span></label>
            <textarea id="contact-message" name="message" required rows={6} className={`field-textarea ${errorClass('message')}`} placeholder="How can we help?" />
            {fieldErrors.message && <p className="field-error-text">{fieldErrors.message}</p>}
          </div>
          <ConsentFields error={fieldErrors.privacyConsent} />
          <div className="form-submit">
            <SubmitButton />
            <p className="form-submit__note"><span className="field-req" aria-hidden="true">*</span> Required fields</p>
          </div>
        </>
      )}
    </form>
  )
}
