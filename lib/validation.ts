import { z } from 'zod'

// Loose but real-world phone validation: digits, spaces, +, -, ( ) — 7-16 digits.
const phoneRegex = /^[+]?[\d\s().-]{7,20}$/

export const admissionsFormSchema = z.object({
  // Personal information
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  email: z.string().trim().min(1, 'Email address is required').email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Enter a valid phone number'),
  whatsapp: z
    .string()
    .trim()
    .regex(phoneRegex, 'Enter a valid WhatsApp number')
    .optional()
    .or(z.literal('')),
  gender: z.enum(['female', 'male', 'prefer_not_to_say']).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  city: z.string().trim().max(120).optional().or(z.literal('')),
  state: z.string().trim().max(120).optional().or(z.literal('')),
  country: z.string().trim().max(120).optional().or(z.literal('')),

  // Academic information
  highestQualification: z.string().trim().max(150).optional().or(z.literal('')),
  institution: z.string().trim().max(200).optional().or(z.literal('')),
  graduationYear: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || (/^\d{4}$/.test(v) && Number(v) >= 1970 && Number(v) <= 2035),
      'Enter a valid graduation year (1970–2035)'
    ),
  previousItExperience: z.string().trim().max(1000).optional().or(z.literal('')),

  // Programme information
  programmeId: z.string().trim().min(1, 'Please select a programme'),
  studyMode: z.enum(['full_time', 'part_time', 'weekend', 'online', 'hybrid']).optional().or(z.literal('')),
  preferredIntake: z.string().trim().max(120).optional().or(z.literal('')),
  expectedStartDate: z.string().optional().or(z.literal('')),

  // Marketing
  source: z.enum([
    'google',
    'facebook',
    'instagram',
    'whatsapp',
    'referral',
    'website',
    'walk_in',
    'advertisement',
    'other'
  ]),

  // Honeypot — must always be empty. Bots that fill every field will trip this.
  companyWebsite: z.string().max(0, 'Spam check failed').optional().or(z.literal(''))
})

export type AdmissionsFormValues = z.infer<typeof admissionsFormSchema>

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
  email: z.string().trim().min(1, 'Email address is required').email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Enter a valid phone number'),
  subject: z.string().trim().max(200).optional().or(z.literal('')),
  message: z.string().trim().min(1, 'Please add a message').max(4000),

  // Honeypot — must always be empty. Bots that fill every field will trip this.
  companyWebsite: z.string().max(0, 'Spam check failed').optional().or(z.literal(''))
})

export type ContactFormValues = z.infer<typeof contactFormSchema>

export const REQUIRED_ADMISSIONS_FIELDS: (keyof AdmissionsFormValues)[] = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'programmeId',
  'source'
]

export const programmeFormSchema = z.object({
  name: z.string().trim().min(1, 'Programme name is required').max(200),
  code: z
    .string()
    .trim()
    .min(1, 'Programme code is required')
    .max(20)
    .regex(/^[A-Z0-9_-]+$/i, 'Use letters, numbers, - or _ only'),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  duration: z.string().trim().max(60).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active')
})

export type ProgrammeFormValues = z.infer<typeof programmeFormSchema>

export const noteFormSchema = z.object({
  leadId: z.string().uuid(),
  type: z.enum(['call', 'whatsapp', 'email', 'sms', 'meeting', 'note', 'website']),
  subject: z.string().trim().max(200).optional().or(z.literal('')),
  description: z.string().trim().min(1, 'Add a short description').max(4000)
})

export const followUpFormSchema = z.object({
  leadId: z.string().uuid(),
  dueDate: z.string().min(1, 'Due date is required'),
  assignedTo: z.string().uuid().optional().or(z.literal('')),
  type: z.enum(['call', 'whatsapp', 'email', 'sms', 'meeting', 'note', 'website']).default('call'),
  notes: z.string().trim().max(2000).optional().or(z.literal(''))
})

export const leadEditSchema = z.object({
  leadId: z.string().uuid(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().regex(phoneRegex),
  whatsapp: z.string().trim().regex(phoneRegex).optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  city: z.string().trim().max(120).optional().or(z.literal('')),
  state: z.string().trim().max(120).optional().or(z.literal('')),
  country: z.string().trim().max(120).optional().or(z.literal(''))
})

// ----------------------------------------------------------------------------
// INSIGHTS & EVENTS
// ----------------------------------------------------------------------------

const optionalDateTime = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || !Number.isNaN(Date.parse(v)), 'Enter a valid date and time')

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || /^https?:\/\/.+/i.test(v), 'Enter a full URL starting with http:// or https://')

export const insightFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200, 'Keep the title under 200 characters'),
    slug: z
      .string()
      .trim()
      .min(1, 'Slug is required')
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only'),
    shortDescription: z.string().trim().max(400, 'Keep the summary under 400 characters').optional().or(z.literal('')),
    content: z.string().trim().min(1, 'Add some content before saving').max(50000),
    category: z.string().trim().min(1, 'Choose a category').max(80),
    contentType: z.enum([
      'news',
      'announcement',
      'event',
      'academic_update',
      'spotlight',
      'achievement',
      'career_update',
      'celebration'
    ]),
    isFeatured: z.enum(['on']).optional().or(z.literal('')),
    publishAt: optionalDateTime,
    expiresAt: optionalDateTime,
    seoTitle: z.string().trim().max(70, 'Keep the SEO title under 70 characters').optional().or(z.literal('')),
    seoDescription: z.string().trim().max(160, 'Keep the meta description under 160 characters').optional().or(z.literal('')),
    // Event fields — only required/validated when contentType === 'event'.
    eventStartAt: optionalDateTime,
    eventEndAt: optionalDateTime,
    eventVenue: z.string().trim().max(200).optional().or(z.literal('')),
    eventRegistrationUrl: optionalUrl,
    eventContact: z.string().trim().max(200).optional().or(z.literal(''))
  })
  .superRefine((val, ctx) => {
    if (val.publishAt && val.expiresAt && Date.parse(val.expiresAt) <= Date.parse(val.publishAt)) {
      ctx.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Expiry must be after the publish date' })
    }
    if (val.contentType === 'event') {
      if (!val.eventStartAt) {
        ctx.addIssue({ code: 'custom', path: ['eventStartAt'], message: 'Event date is required for events' })
      }
      if (val.eventStartAt && val.eventEndAt && Date.parse(val.eventEndAt) < Date.parse(val.eventStartAt)) {
        ctx.addIssue({ code: 'custom', path: ['eventEndAt'], message: 'Event end date cannot be before the start date' })
      }
      if (!val.eventVenue) {
        ctx.addIssue({ code: 'custom', path: ['eventVenue'], message: 'Venue is required for events' })
      }
    }
  })

export type InsightFormValues = z.infer<typeof insightFormSchema>

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

/** Validates an uploaded featured image before it's ever sent to storage. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Featured image must be a JPG, PNG, WEBP or GIF file.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Featured image must be smaller than 5MB.'
  }
  return null
}

/** Turns a title into a clean, URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200)
}

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (!fieldErrors[key]) fieldErrors[key] = issue.message
  }
  return fieldErrors
}
