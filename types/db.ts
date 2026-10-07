// Hand-authored types mirroring the Supabase schema and migrations.
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

export type LeadPriority = 'high' | 'medium' | 'low'

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
  | 'career_quiz'
  | 'tech_challenge'
  | 'advisor_request'
  | 'programme_comparison'

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

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived'
export type CampaignType = 'google_search' | 'meta_facebook' | 'instagram' | 'whatsapp' | 'organic_search' | 'email' | 'referral' | 'offline' | 'event' | 'school_outreach' | 'programme_specific' | 'general_admissions' | 'seasonal' | 'custom'
export type CampaignConversionGoal = 'enquiry' | 'advisor_request' | 'application' | 'enrollment'

export interface Campaign {
  id: string
  name: string
  slug: string
  description: string | null
  status: CampaignStatus
  campaign_type: CampaignType
  start_date: string | null
  end_date: string | null
  programme_id: string | null
  target_audience: string | null
  target_location: string | null
  landing_page: string | null
  primary_cta: string | null
  conversion_goal: CampaignConversionGoal
  source: string | null
  medium: string | null
  campaign_identifier: string
  headline: string | null
  opportunity: string | null
  notes: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface Staff {
  id: string
  full_name: string
  email: string
  role: StaffRole
  is_active: boolean
  // Granular permission, independent of `role` — see migration 0004_insights.sql
  // for why this isn't a new staff_role value.
  can_manage_insights: boolean
  // Granular Admissions Officer permissions — see migration
  // 0016_admissions_granular_permissions.sql. Super Admins always have full
  // access regardless of these flags; they only gate the Admissions Officer
  // role and are toggled per-staff-member from /admin/staff.
  can_update_lead_status: boolean
  can_log_interactions: boolean
  can_start_applications: boolean
  can_schedule_follow_ups: boolean
  // Granular Content Manager permissions — see migration
  // 0017_content_manager_granular_permissions.sql and lib/permissions.ts for
  // the full catalog. A flat map of permission key -> granted, e.g.
  // { "news.view": true, "enquiries.export": false }. Meaningless for roles
  // other than content_manager (Super Admin is always fully authorized;
  // Admissions Officer uses the can_* columns above instead).
  permissions: Record<string, boolean>
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
  priority: LeadPriority
  source: LeadSource
  lost_reason: string | null
  landing_page: string | null
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  first_touch_source: string | null
  first_touch_medium: string | null
  first_touch_campaign: string | null
  first_touch_campaign_id: string | null
  last_touch_source: string | null
  last_touch_medium: string | null
  last_touch_campaign: string | null
  last_touch_campaign_id: string | null
  conversion_point: string | null
  attribution_landing_page: string | null
  attribution_referrer: string | null
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
  enrolled_at: string | null
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
  // Optional staff-written detail (migration 0022). Null/absent = not provided.
  audience?: string | null
  prerequisites?: string | null
  certification?: string | null
  // CRM page controls (migration 0023). Absent only before the migration has run.
  admission_status?: AdmissionStatus
  intake_note?: string | null
  page_heading?: string | null
  related_courses?: string[]
  related_insights?: string[]
  curriculum?: string | null
  featured_home?: boolean
  seo_title: string | null
  seo_description: string | null
  seo_noindex: boolean
  status: CourseStatus
  display_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export type AdmissionStatus = 'open' | 'coming_soon' | 'closed'

export const ADMISSION_STATUS_LABELS: Record<AdmissionStatus, string> = {
  open: 'Applications open',
  coming_soon: 'Opening soon',
  closed: 'Applications closed'
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
  follow_up_later: 'Follow-up',
  not_interested: 'Not Interested',
  unreachable: 'Unreachable',
  lost: 'Lost'
}

export const LEAD_PRIORITY_LABELS: Record<LeadPriority, string> = { high: 'High Priority', medium: 'Medium', low: 'Low' }

export const LEAD_PRIORITY_ORDER: LeadPriority[] = ['high', 'medium', 'low']

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
  'follow_up_later',
  'application_started',
  'application_submitted',
  'enrolled',
  'lost'
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
  other: 'Other',
  career_quiz: 'Career Quiz',
  tech_challenge: 'Tech Challenge',
  advisor_request: 'Advisor Request',
  programme_comparison: 'Programme Comparison'
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
  seo_noindex: boolean
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

/** Permanent redirect created automatically when a course/insight slug changes (migration 0018). */
export interface SeoRedirect {
  id: string
  from_path: string
  to_path: string
  status_code: number
  created_at: string
}
