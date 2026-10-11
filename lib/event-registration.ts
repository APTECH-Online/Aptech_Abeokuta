import { z } from 'zod'

/** Shared by the public registration API route and its tests. */
export const EVENT_INTERESTS = ['general', 'coding', 'career', 'programme', 'admissions'] as const
export const EVENT_CONTACT_METHODS = ['email', 'phone', 'whatsapp', 'none'] as const

const PHONE_PATTERN = /^[0-9+()\-.\s]{6,40}$/

export const eventRegistrationSchema = z
  .object({
    event_id: z.uuid({ error: 'Choose the event you would like to attend.' }),
    full_name: z
      .string({ error: 'Enter your full name.' })
      .trim()
      .min(2, 'Enter your full name.')
      .max(160, 'Keep your name under 160 characters.'),
    email: z
      .string({ error: 'Enter a valid email address, like you@example.com.' })
      .trim()
      .toLowerCase()
      .max(254, 'That email address is too long.')
      .pipe(z.email({ error: 'Enter a valid email address, like you@example.com.' })),
    phone: z
      .string()
      .trim()
      .max(40, 'That phone number is too long.')
      .optional()
      .default('')
      .refine((value) => value === '' || PHONE_PATTERN.test(value), 'Enter a valid phone number.'),
    interest: z.enum(EVENT_INTERESTS).catch('general'),
    preferred_contact: z.enum(EVENT_CONTACT_METHODS).catch('email'),
    registration_consent: z.literal(true, { error: 'Please accept this notice so we can register you.' }),
    marketing_consent: z.boolean().catch(false),
    turnstile_token: z.string().max(2048).optional(),
    /** Honeypot: real visitors never see or fill this field. */
    company_website: z.string().max(200).optional()
  })
  .superRefine((value, ctx) => {
    if ((value.preferred_contact === 'phone' || value.preferred_contact === 'whatsapp') && !value.phone) {
      ctx.addIssue({
        code: 'custom',
        path: ['phone'],
        message: `Add a phone number so we can reach you by ${value.preferred_contact === 'whatsapp' ? 'WhatsApp' : 'phone'}.`
      })
    }
  })

export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>

/** First message per field, keyed by the field name. */
export function registrationFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!errors[key]) errors[key] = issue.message
  }
  return errors
}
