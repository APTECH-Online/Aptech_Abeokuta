'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import FormAlert from '../shared/FormAlert'
import { submitEnquiry, type SubmitEnquiryState } from '../../app/(site)/admissions/actions'

type ProgrammeOption = {
  id: string
  name: string
  duration: string | null
}

const initialState: SubmitEnquiryState = { status: 'idle' }

const SOURCE_OPTIONS = [
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'other', label: 'Other' }
]

const STUDY_MODE_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'weekend', label: 'Weekend' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid' }
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn btn-primary btn-block sm:w-auto sm:justify-self-start disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Submitting…' : 'Submit application'}
    </button>
  )
}

export default function AdmissionsForm({ programmes }: { programmes: ProgrammeOption[] }) {
  const [state, formAction] = useActionState(submitEnquiry, initialState)
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLFormElement>(null)
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false)
  const [landingPage, setLandingPage] = useState('')
  const [referrer, setReferrer] = useState('')

  useEffect(() => {
    setLandingPage(window.location.pathname)
    setReferrer(document.referrer)
  }, [])

  const fieldErrors = state.status === 'error' ? state.fieldErrors ?? {} : {}

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset()
      setHasSubmittedOnce(true)
      // Bring the confirmation into view for long forms on mobile.
      const el = document.getElementById('admissions-form-result')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [state])

  const errorClass = (field: string) => (fieldErrors[field] ? 'field-error' : '')

  return (
    <form ref={formRef} action={formAction} className="mt-8 card p-6 sm:p-8 grid gap-8" noValidate>
      {/* Hidden tracking fields */}
      <input type="hidden" name="landingPage" value={landingPage || '/admissions'} />
      <input type="hidden" name="referrer" value={referrer} />
      <input type="hidden" name="utm_source" value={searchParams.get('utm_source') || ''} />
      <input type="hidden" name="utm_medium" value={searchParams.get('utm_medium') || ''} />
      <input type="hidden" name="utm_campaign" value={searchParams.get('utm_campaign') || ''} />
      <input type="hidden" name="utm_content" value={searchParams.get('utm_content') || ''} />
      <input type="hidden" name="utm_term" value={searchParams.get('utm_term') || ''} />
      {/* Honeypot — hidden from real visitors via CSS, not display:none, so simple bots that skip hidden fields still get caught less reliably; kept minimal and off-screen */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="companyWebsite">Leave this field empty</label>
        <input id="companyWebsite" name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === 'success' ? (
        <div id="admissions-form-result">
          <FormAlert variant="success" title="Enquiry received">
            <p>
              Thank you for your interest in APTECH Abeokuta. Your enquiry has been received
              successfully. Our admissions team will contact you shortly.
            </p>
            {state.leadReference && state.leadReference !== 'APC-0000-000000' && (
              <p className="mt-2 font-mono text-xs sm:text-sm" style={{ color: 'var(--color-ink)' }}>
                Your reference number: <strong>{state.leadReference}</strong>
              </p>
            )}
          </FormAlert>
        </div>
      ) : (
        <>
          {state.status === 'error' && (
            <div id="admissions-form-result">
              <FormAlert variant="error" title="We couldn't submit your enquiry">
                <p>{state.message}</p>
              </FormAlert>
            </div>
          )}

          {/* Personal information */}
          <fieldset className="grid gap-5">
            <legend className="eyebrow mb-1">Personal information</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className="field-label">First name *</label>
                <input id="firstName" name="firstName" required className={`field-input ${errorClass('firstName')}`} placeholder="e.g. Ade" />
                {fieldErrors.firstName && <p className="field-error-text">{fieldErrors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="field-label">Last name *</label>
                <input id="lastName" name="lastName" required className={`field-input ${errorClass('lastName')}`} placeholder="e.g. Ogundele" />
                {fieldErrors.lastName && <p className="field-error-text">{fieldErrors.lastName}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="email" className="field-label">Email address *</label>
                <input id="email" name="email" type="email" required className={`field-input ${errorClass('email')}`} placeholder="you@example.com" />
                {fieldErrors.email && <p className="field-error-text">{fieldErrors.email}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="field-label">Phone number *</label>
                <input id="phone" name="phone" type="tel" required className={`field-input ${errorClass('phone')}`} placeholder="e.g. 080X XXX XXXX" />
                {fieldErrors.phone && <p className="field-error-text">{fieldErrors.phone}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="whatsapp" className="field-label">WhatsApp number</label>
                <input id="whatsapp" name="whatsapp" type="tel" className={`field-input ${errorClass('whatsapp')}`} placeholder="If different from phone" />
                {fieldErrors.whatsapp && <p className="field-error-text">{fieldErrors.whatsapp}</p>}
              </div>
              <div>
                <label htmlFor="gender" className="field-label">Gender</label>
                <select id="gender" name="gender" className="field-select" defaultValue="">
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="dateOfBirth" className="field-label">Date of birth</label>
                <input id="dateOfBirth" name="dateOfBirth" type="date" className="field-input" />
              </div>
              <div>
                <label htmlFor="city" className="field-label">City</label>
                <input id="city" name="city" className="field-input" placeholder="e.g. Abeokuta" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="state" className="field-label">State</label>
                <input id="state" name="state" className="field-input" placeholder="e.g. Ogun" />
              </div>
              <div>
                <label htmlFor="country" className="field-label">Country</label>
                <input id="country" name="country" className="field-input" defaultValue="Nigeria" />
              </div>
            </div>
            <div>
              <label htmlFor="address" className="field-label">Address</label>
              <input id="address" name="address" className="field-input" placeholder="Street address" />
            </div>
          </fieldset>

          {/* Academic information */}
          <fieldset className="grid gap-5">
            <legend className="eyebrow mb-1">Academic information</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="highestQualification" className="field-label">Highest qualification</label>
                <input id="highestQualification" name="highestQualification" className="field-input" placeholder="e.g. SSCE, OND, HND, BSc" />
              </div>
              <div>
                <label htmlFor="institution" className="field-label">School / institution</label>
                <input id="institution" name="institution" className="field-input" placeholder="e.g. Federal Government College" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="graduationYear" className="field-label">Graduation year</label>
                <input id="graduationYear" name="graduationYear" type="number" min="1970" max="2035" className="field-input" placeholder="e.g. 2024" />
              </div>
              <div>
                <label htmlFor="previousItExperience" className="field-label">Previous IT/computer experience</label>
                <input id="previousItExperience" name="previousItExperience" className="field-input" placeholder="e.g. None, self-taught, basic" />
              </div>
            </div>
          </fieldset>

          {/* Programme information */}
          <fieldset className="grid gap-5">
            <legend className="eyebrow mb-1">Programme information</legend>
            <div>
              <label htmlFor="programmeId" className="field-label">Programme of interest *</label>
              <select id="programmeId" name="programmeId" required className={`field-select ${errorClass('programmeId')}`} defaultValue="">
                <option value="" disabled>Select a programme</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.duration ? ` (${p.duration})` : ''}</option>
                ))}
              </select>
              {fieldErrors.programmeId && <p className="field-error-text">{fieldErrors.programmeId}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="studyMode" className="field-label">Preferred study mode</label>
                <select id="studyMode" name="studyMode" className="field-select" defaultValue="">
                  <option value="">No preference</option>
                  {STUDY_MODE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="preferredIntake" className="field-label">Preferred intake</label>
                <input id="preferredIntake" name="preferredIntake" className="field-input" placeholder="e.g. January 2027" />
              </div>
            </div>
            <div>
              <label htmlFor="expectedStartDate" className="field-label">Expected start date</label>
              <input id="expectedStartDate" name="expectedStartDate" type="date" className="field-input" />
            </div>
          </fieldset>

          {/* Marketing */}
          <fieldset className="grid gap-5">
            <legend className="eyebrow mb-1">How did you hear about us?</legend>
            <div>
              <label htmlFor="source" className="field-label">Source *</label>
              <select id="source" name="source" required className={`field-select ${errorClass('source')}`} defaultValue="">
                <option value="" disabled>Select an option</option>
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {fieldErrors.source && <p className="field-error-text">{fieldErrors.source}</p>}
            </div>
          </fieldset>

          <div>
            <SubmitButton />
            <p className="field-hint">
              By submitting, you agree to be contacted by APTECH Abeokuta about your enquiry. See our{' '}
              <a href="/privacy" className="underline">privacy policy</a>.
            </p>
          </div>
        </>
      )}

      {hasSubmittedOnce && state.status === 'success' && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-secondary justify-self-start"
        >
          Submit another enquiry
        </button>
      )}
    </form>
  )
}
