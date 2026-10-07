import 'server-only'
import { createAdminClient } from './supabase/admin'
import { requireChallengesAccess } from './auth'

export type PublicChallenge = {
  id: string
  name: string
  slug: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_minutes: number
  challenge_type: string
  is_featured: boolean
  is_weekly: boolean
  sort_order: number
  question_count: number
}

export type PublicQuestion = {
  id: string
  question: string
  options: string[]
  skill_area: string
  difficulty: string
  points: number
  sort_order: number
  explanation?: string | null
}

export async function getPublicChallenges(): Promise<PublicChallenge[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('tech_challenges').select('id,name,slug,description,category,difficulty,estimated_minutes,challenge_type,is_featured,is_weekly,sort_order,tech_challenge_questions(count)').eq('status','active').or('start_date.is.null,start_date.lte.' + new Date().toISOString()).or('end_date.is.null,end_date.gte.' + new Date().toISOString()).order('sort_order')
  if (error) throw error
  return (data ?? []).map((c: any) => ({ ...c, question_count: c.tech_challenge_questions?.[0]?.count ?? 0, tech_challenge_questions: undefined }))
}

export async function getPublicChallenge(slug: string) {
  const admin = createAdminClient()
  const now = new Date().toISOString()
  const { data: challenge, error } = await admin.from('tech_challenges').select('id,name,slug,description,category,difficulty,estimated_minutes,challenge_type,is_featured,is_weekly,sort_order,scoring_config,recommendation_rules').eq('slug',slug).eq('status','active').or(`start_date.is.null,start_date.lte.${now}`).or(`end_date.is.null,end_date.gte.${now}`).maybeSingle()
  if (error) throw error
  if (!challenge) return null
  const { data: questions, error: questionError } = await admin.from('tech_challenge_questions').select('id,question,options,skill_area,difficulty,points,sort_order,explanation').eq('challenge_id',challenge.id).order('sort_order')
  if (questionError) throw questionError
  return { challenge, questions: (questions ?? []).map((q: any) => ({ ...q, options: Array.isArray(q.options) ? q.options : [] })) as PublicQuestion[] }
}

export async function requireChallengeAccess(action: 'view'|'create'|'edit'|'delete') {
  return requireChallengesAccess(action)
}

export async function getAdminChallenges() {
  await requireChallengeAccess('view')
  const admin = createAdminClient()
  const { data, error } = await admin.from('tech_challenges').select('*, tech_challenge_questions(id)').order('sort_order')
  if (error) throw error
  return (data ?? []).map((c: any) => ({ ...c, question_count: c.tech_challenge_questions?.length ?? 0 }))
}

export async function getAdminChallenge(id: string) {
  await requireChallengeAccess('view')
  const admin = createAdminClient()
  const [{ data: challenge, error }, { data: questions, error: qError }, { data: programmes, error: pError }] = await Promise.all([
    admin.from('tech_challenges').select('*').eq('id', id).maybeSingle(),
    admin.from('tech_challenge_questions').select('*').eq('challenge_id', id).order('sort_order'),
    admin.from('programmes').select('id,name,status').order('display_order')
  ])
  if (error) throw error
  if (qError) throw qError
  if (pError) throw pError
  return { challenge, questions: questions ?? [], programmes: programmes ?? [] }
}
