// Hand-authored types mirroring supabase/migrations/0001_init.sql.
// If the schema changes, update this file to match.

export type StaffRole =
  | 'super_admin'
  | 'content_manager'
  | 'admissions_officer'
  // Legacy values remain in the database enum for backwards-compatible migrations,
  // but the CRM no longer grants them permissions or exposes them in staff creation.
  | 'admissions_manager'
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
  // Granular permission, independent of `role` — see migration 0004_insights.sql
  // for why this isn't a new staff_role value.
  can_manage_insights: boolean
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

export type NotificationType =
  | 'lead.created'
  | 'lead.resubmitted'
  | 'application.created'
  | 'followup.due'
  | 'followup.overdue'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  entity: string | null
  entity_id: string | null
  recipient_id: string | null
  target_roles: StaffRole[] | null
  created_at: string
  // Not a DB column — merged in application code from notification_reads.
  read_at?: string | null
}

export type GalleryDisplaySize = 'feature' | 'tall' | 'standard'

export interface GalleryItem {
  id: string
  title: string
  category: string
  alt_text: string
  image_url: string
  display_size: GalleryDisplaySize
  sort_order: number
  is_published: boolean
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export const GALLERY_CATEGORIES = ['Campus', 'Students', 'Events', 'Learning', 'Staff', 'Facilities'] as const
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number]

export const GALLERY_DISPLAY_SIZE_LABELS: Record<GalleryDisplaySize, string> = {
  feature: 'Feature (large)',
  tall: 'Tall',
  standard: 'Standard'
}

export type CourseCategory = 'advanced_diploma' | 'smart_pro' | 'acns' | 'short_term'
export type CourseStatus = 'draft' | 'published' | 'archived'

export interface Course {
  id: string
  title: string
  slug: string
  category: CourseCategory
  duration: string
  level: string
  mode: string
  summary: string
  description: string
  highlights: string[]
  tools: string[]
  outcomes: string[]
  cover_image: string | null
  status: CourseStatus
  display_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
  advanced_diploma: 'Advanced Diploma',
  smart_pro: 'Smart Pro',
  acns: 'Aptech Certified Network Specialist',
  short_term: 'Short Term Courses'
}

export const COURSE_CATEGORY_ORDER: CourseCategory[] = ['advanced_diploma', 'smart_pro', 'acns', 'short_term']

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived'
}

export interface Testimonial {
  id: string
  name: string
  program: string
  quote: string
  image_url: string | null
  sort_order: number
  is_published: boolean
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export interface Faq {
  id: string
  question: string
  answer: string
  sort_order: number
  is_published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// Keep in sync with SOCIAL_PLATFORMS in lib/crm/social-links.ts and the
// `social_links_platform_check` constraint in migration 0010_social_links.sql.
export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'twitter_x'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'
  | 'whatsapp'
  | 'other'

export interface SocialLink {
  id: string
  platform: SocialPlatform
  label: string | null
  url: string
  sort_order: number
  is_published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// Text cards under "Partners & alliances" on the About page (e.g. Avigo
// Investment Limited, the Middlesex/Portsmouth alliance).
export interface PartnerOrganization {
  id: string
  title: string
  body: string
  points: string[]
  sort_order: number
  is_published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// Logo grid under "Affiliated universities" on the Home and About pages.
export interface AffiliatedUniversity {
  id: string
  name: string
  logo_url: string
  website_url: string | null
  sort_order: number
  is_published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// Singleton row backing the "Backed by Avigo..." highlight card on the
// homepage — headline, supporting line, and its button.
export interface PartnersHighlight {
  id: string
  headline: string
  description: string
  cta_label: string
  cta_href: string
  is_published: boolean
  updated_by: string | null
  updated_at: string
}

export interface ContactHour {
  day: string
  time: string
}

export interface ContactInfo {
  id: string
  phone: string
  whatsapp: string
  email: string
  address: string
  hours: ContactHour[]
  updated_by: string | null
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
  content_manager: 'Content Manager',
  admissions_manager: 'Admissions Manager',
  admissions_officer: 'Admissions Officer',
  counsellor: 'Counsellor',
  viewer: 'Viewer'
}

// ----------------------------------------------------------------------------
// INSIGHTS & EVENTS
// ----------------------------------------------------------------------------

export type InsightStatus = 'draft' | 'scheduled' | 'published' | 'archived'

export type InsightContentType =
  | 'news'
  | 'announcement'
  | 'event'
  | 'academic_update'
  | 'spotlight'
  | 'achievement'
  | 'career_update'
  | 'celebration'

export interface Insight {
  id: string
  title: string
  slug: string
  short_description: string | null
  content: string
  featured_image: string | null
  category: string
  content_type: InsightContentType
  author_id: string | null
  status: InsightStatus
  is_featured: boolean
  featured_priority: number
  publish_at: string | null
  expires_at: string | null
  seo_title: string | null
  seo_description: string | null
  event_start_at: string | null
  event_end_at: string | null
  event_venue: string | null
  event_registration_url: string | null
  event_contact: string | null
  created_at: string
  updated_at: string
}

export const INSIGHT_STATUS_LABELS: Record<InsightStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived'
}

export const INSIGHT_CONTENT_TYPE_LABELS: Record<InsightContentType, string> = {
  news: 'News',
  announcement: 'Announcement',
  event: 'Event',
  academic_update: 'Academic Update',
  spotlight: 'Student/Alumni Spotlight',
  achievement: 'Achievement',
  career_update: 'Career/Industry Update',
  celebration: 'Celebration'
}

export const INSIGHT_CONTENT_TYPE_ORDER: InsightContentType[] = [
  'news',
  'announcement',
  'event',
  'academic_update',
  'spotlight',
  'achievement',
  'career_update',
  'celebration'
]

// Curated category list shown in the CRM editor's datalist and used to
// validate submissions. Includes the categories the public site already
// used (data/insights.ts) plus the new CMS categories from the brief, so
// existing content keeps filtering correctly. `category` is still a plain
// text column (see migration 0004), so this list can grow without a schema
// change — just add a value here.
export const INSIGHT_CATEGORIES = [
  'News',
  'Announcements',
  'Academic Updates',
  'Student/Alumni Spotlights',
  'Achievements',
  'Career/Industry Updates',
  'Celebrations',
  'Career Guides',
  'Technology',
  'Student Guides',
  'APTECH Abeokuta'
] as const

export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number]
