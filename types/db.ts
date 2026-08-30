// Hand-authored types mirroring supabase/migrations/0001_init.sql.
// If the schema changes, update this file to match.

export type StaffRole =
  | 'super_admin'
  | 'admissions_manager'
  | 'admissions_officer'
  | 'counsellor'
  | 'viewer'

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'counselling'
  | 'application_started'
  | 'application_submitted'
  | 'admission_offered'
  | 'enrolled'
  | 'follow_up_later'
  | 'not_interested'
  | 'unreachable'
  | 'lost'

export type LeadSource =
  | 'google'
  | 'facebook'
  | 'instagram'
  | 'whatsapp'
  | 'referral'
  | 'website'
  | 'walk_in'
  | 'advertisement'
  | 'other'

export type StudyMode = 'full_time' | 'part_time' | 'weekend' | 'online' | 'hybrid'

export type InteractionType = 'call' | 'whatsapp' | 'email' | 'sms' | 'meeting' | 'note' | 'website'

export type FollowUpStatus = 'pending' | 'completed' | 'cancelled' | 'overdue'

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'enrolled'

export type ProgrammeStatus = 'active' | 'inactive'

export interface Staff {
  id: string
  full_name: string
  email: string
  role: StaffRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Programme {
  id: string
  name: string
  code: string
  description: string | null
  duration: string | null
  status: ProgrammeStatus
  display_order: number
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  lead_reference: string
  first_name: string
  last_name: string
  email: string
  phone: string
  whatsapp: string | null
  gender: string | null
  date_of_birth: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  status: LeadStatus
  source: LeadSource
  landing_page: string | null
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface LeadEducation {
  id: string
  lead_id: string
  highest_qualification: string | null
  institution: string | null
  graduation_year: number | null
  previous_it_experience: string | null
  created_at: string
  updated_at: string
}

export interface LeadInterest {
  id: string
  lead_id: string
  programme_id: string | null
  study_mode: StudyMode | null
  preferred_intake: string | null
  expected_start_date: string | null
  created_at: string
}

export interface Application {
  id: string
  application_reference: string
  lead_id: string
  programme_id: string | null
  status: ApplicationStatus
  assigned_to: string | null
  submitted_at: string
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface Interaction {
  id: string
  lead_id: string
  user_id: string | null
  type: InteractionType
  subject: string | null
  description: string | null
  created_at: string
}

export interface FollowUp {
  id: string
  lead_id: string
  assigned_to: string | null
  due_date: string
  type: InteractionType
  status: FollowUpStatus
  notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  entity: string
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  counselling: 'Counselling',
  application_started: 'Application Started',
  application_submitted: 'Application Submitted',
  admission_offered: 'Admission Offered',
  enrolled: 'Enrolled',
  follow_up_later: 'Follow Up Later',
  not_interested: 'Not Interested',
  unreachable: 'Unreachable',
  lost: 'Lost'
}

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  'new',
  'contacted',
  'interested',
  'counselling',
  'application_started',
  'application_submitted',
  'admission_offered',
  'enrolled',
  'follow_up_later',
  'not_interested',
  'unreachable',
  'lost'
]

export const PIPELINE_STAGES: LeadStatus[] = [
  'new',
  'contacted',
  'interested',
  'counselling',
  'application_submitted',
  'enrolled'
]

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  google: 'Google',
  facebook: 'Facebook',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  referral: 'Referral',
  website: 'Website',
  walk_in: 'Walk-in',
  advertisement: 'Advertisement',
  other: 'Other'
}

export const STUDY_MODE_LABELS: Record<StudyMode, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  weekend: 'Weekend',
  online: 'Online',
  hybrid: 'Hybrid'
}

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  call: 'Call',
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS',
  meeting: 'Meeting',
  note: 'Note',
  website: 'Website'
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  enrolled: 'Enrolled'
}

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
  overdue: 'Overdue'
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: 'Super Admin',
  admissions_manager: 'Admissions Manager',
  admissions_officer: 'Admissions Officer',
  counsellor: 'Counsellor',
  viewer: 'Viewer'
}
