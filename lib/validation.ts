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
  graduationYear: z.string().trim().optional().or(z.literal('')),
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

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (!fieldErrors[key]) fieldErrors[key] = issue.message
  }
  return fieldErrors
}
