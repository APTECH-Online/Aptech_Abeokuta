'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import IconTile from '../ui/IconTile'
import FormAlert from '../shared/FormAlert'
import WhatsAppButton from '../shared/WhatsAppButton'
import { eventParts, eventTime, timeRange } from '../insights/event-utils'
import { SELECT_EVENT, eventWhere, type EventOption } from './event-meta'

const INTERESTS = [
  { value: 'general', label: 'Explore technology' },
  { value: 'coding', label: 'Introductory coding' },
  { value: 'career', label: 'Technology careers' },
  { value: 'programme', label: 'Choosing a programme' },
  { value: 'admissions', label: 'Admissions and fees' }
]

const CONTACT_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Phone call' },
  { value: 'none', label: 'Do not contact me after registration' }
]

type Status = 'idle' | 'error' | 'success'
type FieldErrors = Partial<Record<'event_id' | 'full_name' | 'email' | 'phone' | 'registration_consent', string>>

const optionLabel = (e: EventOption) => `${e.title} — ${eventParts(e.starts_at).dateShort}, ${eventTime(e.starts_at)}`

/** The calendar tile + facts for the chosen event, so people can see what they picked. */
function PickedEvent({ event }: { event: EventOption }) {
  const p = eventParts(event.starts_at)
  return (
    <div className="ev-picked" aria-live="polite">
      <div className="ev-picked__date" aria-hidden="true">
        <span className="ev-picked__day">{p.day}</span>
        <span className="ev-picked__mo">{p.month}</span>
      </div>
      <div className="ev-picked__text">
        <p className="ev-picked__title">{event.title}</p>
        <p className="ev-picked__meta">{p.weekdayLong} · {timeRange(event.starts_at, event.ends_at)} WAT · {eventWhere(event)}</p>
      </div>
    </div>
  )
}

export default function EventRegistrationForm({
  events,
  whatsapp,
  initialEventId = ''
}: {
  events: EventOption[]
  whatsapp: string
  initialEventId?: string
}) {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [eventId, setEventId] = useState(events.some((e) => e.id === initialEventId) ? initialEventId : '')
  const [contact, setContact] = useState('email')
  const [registered, setRegistered] = useState<EventOption | null>(null)

  const noEvents = events.length === 0
  const picked = events.find((e) => e.id === eventId) ?? null

  // Cards above the form dispatch this when someone taps "Register for this event".
  useEffect(() => {
    const onSelect = (ev: Event) => {
      const id = (ev as CustomEvent<{ eventId?: string }>).detail?.eventId
      if (id && events.some((e) => e.id === id)) {
        setEventId(id)
        setFieldErrors((prev) => ({ ...prev, event_id: undefined }))
      }
    }
    window.addEventListener(SELECT_EVENT, onSelect)
    return () => window.removeEventListener(SELECT_EVENT, onSelect)
  }, [events])

  const errorClass = (k: keyof FieldErrors) => (fieldErrors[k] ? 'field-error' : '')
  const describedBy = (k: keyof FieldErrors, hint?: string) => [fieldErrors[k] ? `err-${k}` : '', hint ?? ''].filter(Boolean).join(' ') || undefined

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Keep a reference: e.currentTarget is null once we await.
    const form = e.currentTarget
    const f = new FormData(form)
    const full_name = String(f.get('full_name') || '').trim()
    const email = String(f.get('email') || '').trim()
    const phone = String(f.get('phone') || '').trim()
    const consent = f.get('registration_consent') === 'on'

    const errs: FieldErrors = {}
    if (!eventId) errs.event_id = 'Choose the event you would like to attend.'
    if (!full_name) errs.full_name = 'Enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Enter a valid email address, like you@example.com.'
    if ((contact === 'phone' || contact === 'whatsapp') && !phone) errs.phone = `Add a phone number so we can reach you by ${contact === 'whatsapp' ? 'WhatsApp' : 'phone'}.`
    if (!consent) errs.registration_consent = 'Please accept this notice so we can register you.'

    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      setStatus('error')
      setMessage('')
      const first = (['event_id', 'full_name', 'email', 'phone', 'registration_consent'] as const).find((k) => errs[k])
      if (first) (form.elements.namedItem(first) as HTMLElement | null)?.focus()
      return
    }

    setBusy(true)
    setFieldErrors({})
    setMessage('')
    try {
      const r = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          full_name,
          email,
          phone,
          interest: String(f.get('interest') || 'general'),
          preferred_contact: contact,
          registration_consent: true,
          marketing_consent: f.get('marketing_consent') === 'on'
        })
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok) {
        setRegistered(picked)
        setStatus('success')
        form.reset()
        setEventId('')
        setContact('email')
      } else {
        setStatus('error')
        setMessage(d.message || 'Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Registration is temporarily unavailable. Please try again in a few minutes.')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'success') {
    return (
      <div className="form-card ev-form">
        <div className="form-success" role="status">
          <IconTile icon={CheckCircle2} tone="teal" size="lg" />
          <h3 className="form-success__title">You&apos;re registered</h3>
          <p className="form-success__text">
            Thank you for registering. We look forward to seeing you{registered ? ' at this session:' : '.'}
          </p>
          {registered && <div className="ev-success-event"><PickedEvent event={registered} /></div>}
          <button type="button" className="btn btn-secondary ev-success-again" onClick={() => setStatus('idle')}>
            Register for another event
          </button>
        </div>
      </div>
    )
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  return (
    <form onSubmit={submit} className="form-card ev-form" noValidate>
      <p className="form-note"><span className="field-req" aria-hidden="true">*</span> Required fields</p>

      {status === 'error' && hasFieldErrors && (
        <FormAlert variant="error" title="Please fix the highlighted fields">
          <p>Check the fields marked below, then register again.</p>
        </FormAlert>
      )}
      {status === 'error' && !hasFieldErrors && message && (
        <FormAlert variant="error" title="We couldn't complete your registration">
          <p>{message}</p>
          <div className="ev-alert-action">
            <WhatsAppButton
              whatsapp={whatsapp}
              variant="secondary"
              label="Contact the team"
              message="Hi APTECH Abeokuta, I tried to register for an event on your website but it didn't go through. Can you help?"
              contextLabel="Event registration form"
              contextType="page"
            />
          </div>
        </FormAlert>
      )}
      {noEvents && (
        <FormAlert variant="info" title="No events are open for registration right now">
          <p>New sessions are added regularly. Check back soon, or <a href="/contact" className="underline">contact our team</a> to hear about the next one.</p>
        </FormAlert>
      )}

      {/* 1 — Event */}
      <fieldset className="form-section">
        <legend className="form-legend"><span className="form-step" aria-hidden="true">1</span>Choose your event</legend>
        <div>
          <label htmlFor="event_id" className="field-label">Event <span className="field-req" aria-hidden="true">*</span></label>
          <select
            id="event_id"
            name="event_id"
            required
            disabled={noEvents}
            value={eventId}
            onChange={(e) => { setEventId(e.target.value); setFieldErrors((p) => ({ ...p, event_id: undefined })) }}
            className={`field-select ${errorClass('event_id')}`}
            aria-invalid={fieldErrors.event_id ? true : undefined}
            aria-describedby={describedBy('event_id')}
          >
            <option value="" disabled>{noEvents ? 'No events open right now' : 'Select a workshop or event'}</option>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{optionLabel(ev)}</option>)}
          </select>
          {fieldErrors.event_id && <p id="err-event_id" className="field-error-text">{fieldErrors.event_id}</p>}
        </div>
        {picked && <PickedEvent event={picked} />}
      </fieldset>

      {/* 2 — Details */}
      <fieldset className="form-section">
        <legend className="form-legend"><span className="form-step" aria-hidden="true">2</span>Your details</legend>
        <div className="ev-row ev-row--2">
          <div>
            <label htmlFor="full_name" className="field-label">Full name <span className="field-req" aria-hidden="true">*</span></label>
            <input
              id="full_name" name="full_name" required maxLength={160} autoComplete="name"
              className={`field-input ${errorClass('full_name')}`} placeholder="e.g. Ade Ogundele"
              aria-invalid={fieldErrors.full_name ? true : undefined} aria-describedby={describedBy('full_name')}
            />
            {fieldErrors.full_name && <p id="err-full_name" className="field-error-text">{fieldErrors.full_name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="field-label">Email address <span className="field-req" aria-hidden="true">*</span></label>
            <input
              id="email" name="email" type="email" required maxLength={254} autoComplete="email" inputMode="email"
              className={`field-input ${errorClass('email')}`} placeholder="you@example.com"
              aria-invalid={fieldErrors.email ? true : undefined} aria-describedby={describedBy('email')}
            />
            {fieldErrors.email && <p id="err-email" className="field-error-text">{fieldErrors.email}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="phone" className="field-label">Phone / WhatsApp number <span className="ev-opt">(optional)</span></label>
          <input
            id="phone" name="phone" type="tel" maxLength={40} autoComplete="tel"
            className={`field-input ${errorClass('phone')}`} placeholder="e.g. 080X XXX XXXX"
            aria-invalid={fieldErrors.phone ? true : undefined} aria-describedby={describedBy('phone', 'hint-phone')}
          />
          {fieldErrors.phone && <p id="err-phone" className="field-error-text">{fieldErrors.phone}</p>}
          <p id="hint-phone" className="field-hint">We only call or message you if you choose that below.</p>
        </div>
      </fieldset>

      {/* 3 — Preferences */}
      <fieldset className="form-section">
        <legend className="form-legend"><span className="form-step" aria-hidden="true">3</span>What would help you most?</legend>
        <div className="ev-row ev-row--2">
          <div>
            <label htmlFor="interest" className="field-label">What are you interested in?</label>
            <select id="interest" name="interest" className="field-select" defaultValue="general">
              {INTERESTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="preferred_contact" className="field-label">How should we contact you?</label>
            <select
              id="preferred_contact" name="preferred_contact" className="field-select"
              value={contact}
              onChange={(e) => { setContact(e.target.value); setFieldErrors((p) => ({ ...p, phone: undefined })) }}
            >
              {CONTACT_METHODS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      {/* Consent + submit */}
      <div className="form-section">
        <div className="consent-box">
          <label className="consent-row" htmlFor="registration_consent">
            <input
              id="registration_consent" type="checkbox" name="registration_consent" required
              aria-invalid={fieldErrors.registration_consent ? true : undefined} aria-describedby={describedBy('registration_consent')}
            />
            <span>
              I agree that APTECH Abeokuta may use these details to manage my registration and provide event-related information. See our{' '}
              <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>. <span aria-hidden="true">*</span>
            </span>
          </label>
          <label className="consent-row" htmlFor="marketing_consent">
            <input id="marketing_consent" type="checkbox" name="marketing_consent" />
            <span>Optional: send me programme and admissions updates. I can opt out later.</span>
          </label>
          {fieldErrors.registration_consent && <p id="err-registration_consent" className="consent-error" role="alert">{fieldErrors.registration_consent}</p>}
        </div>

        <div className="form-submit">
          <button type="submit" disabled={busy || noEvents} aria-busy={busy} className="btn btn-primary ev-submit">
            {busy ? (
              <><Loader2 size={17} className="ev-spin" aria-hidden="true" />Registering…</>
            ) : (
              <>Register for this event<ArrowRight size={17} aria-hidden="true" /></>
            )}
          </button>
          <p className="form-submit__note">Registration is not an application for admission. Marketing updates are optional and separate from event registration.</p>
        </div>
      </div>
    </form>
  )
}
