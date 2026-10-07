import type { Course } from '../data/courses'

export type DiscoveryAnswers = {
  interest: string
  enjoyment: string
  goal: string
  experience: string
  excitement: string
}

const AFFINITY: Record<string, string[]> = {
  software: ['software', 'development', 'programming', 'python', 'java', 'full-stack', 'application'],
  data: ['data', 'analytics', 'analysis', 'sql', 'excel', 'database', 'ai', 'artificial intelligence'],
  cyber: ['cyber', 'security', 'linux', 'network', 'server'],
  networking: ['network', 'server', 'linux', 'infrastructure', 'windows'],
  web: ['web', 'website', 'html', 'css', 'javascript', 'frontend', 'responsive'],
  business: ['business', 'office', 'excel', 'productivity', 'automation']
}

const ANSWER_TO_INTEREST: Record<string, string> = {
  websites: 'web',
  data: 'data',
  experiences: 'web',
  technology: 'software',
  business: 'business',
  software: 'software',
  analysis: 'data',
  tools: 'business',
  exploring: 'software'
}

function searchableCourseText(course: Course) {
  return [course.title, course.category, course.summary, course.description, ...course.highlights, ...course.tools, ...course.outcomes]
    .join(' ')
    .toLowerCase()
}

function scoreCourse(course: Course, answers: DiscoveryAnswers) {
  const text = searchableCourseText(course)
  let score = 0

  const primaryInterest = ANSWER_TO_INTEREST[answers.interest]
  if (primaryInterest) {
    for (const keyword of AFFINITY[primaryInterest] ?? []) if (text.includes(keyword)) score += 7
  }

  const secondaryInterest = ANSWER_TO_INTEREST[answers.excitement]
  if (secondaryInterest) {
    for (const keyword of AFFINITY[secondaryInterest] ?? []) if (text.includes(keyword)) score += 4
  }

  if (answers.enjoyment === 'solving' && /software|development|programming|security|network|data|sql|technical/.test(text)) score += 4
  if (answers.enjoyment === 'creating' && /development|web|design|software|application/.test(text)) score += 4
  if (answers.enjoyment === 'analysing' && /data|analytics|sql|excel|analysis/.test(text)) score += 5
  if (answers.enjoyment === 'people' && /business|office|productivity|management/.test(text)) score += 3
  if (answers.enjoyment === 'exploring' && /technology|software|network|security|data/.test(text)) score += 3

  if (answers.goal === 'career' && /advanced diploma|smart pro|professional|software|network|data|cyber/.test(text)) score += 3
  if (answers.goal === 'skills' && /short|excel|office|linux|web|skill/.test(text)) score += 3
  if (answers.goal === 'change-career' && /professional|diploma|development|data|network|security/.test(text)) score += 3
  if (answers.goal === 'academic' && /advanced diploma|diploma|software|professional/.test(text)) score += 3
  if (answers.goal === 'freelance' && /web|software|development|digital/.test(text)) score += 4

  if (answers.experience === 'beginner') {
    if (/short term|smart pro|office|excel|web/.test(text)) score += 2
  } else if (answers.experience === 'some') {
    if (/professional|short term|advanced diploma/.test(text)) score += 2
  } else if (answers.experience === 'intermediate' && /advanced|professional|diploma|specialist/.test(text)) {
    score += 3
  } else if (answers.experience === 'advanced' && /advanced|specialist|professional/.test(text)) {
    score += 4
  }

  return score
}

export function rankRecommendations(courses: Course[], answers: DiscoveryAnswers): Course[] {
  return courses
    .map((course, index) => ({ course, score: scoreCourse(course, answers), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ course }) => course)
}

export function getCareerDirection(course: Course) {
  const text = searchableCourseText(course)
  if (/data|analytics|sql|excel|ai/.test(text)) return 'Data, analytics and AI-focused technology work'
  if (/cyber|security/.test(text)) return 'Cybersecurity and technology security work'
  if (/network|server|infrastructure/.test(text)) return 'Networking, systems and infrastructure work'
  if (/web|website|html|css|javascript/.test(text)) return 'Web and digital product development'
  if (/business|office|productivity/.test(text)) return 'Business, office and digital productivity work'
  return 'Software and technology development'
}
