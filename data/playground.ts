// Tech Playground — static, client-safe content and scoring helpers.
// Quiz-style challenges (weekly, detective, speed round, data detective, 7-day
// streak) are CRM-managed in `tech_challenges`. Only the personality/pathway
// tools, Code Lab and Spin to Learn are defined here.

export type CareerKey = 'software' | 'data' | 'web' | 'database' | 'cyber' | 'marketing' | 'bi' | 'design'

export type Career = {
  key: CareerKey
  title: string
  summary: string
  skills: string[]
  nextSteps: string[]
  programmeCode: 'ADSE' | 'SMARTPRO' | 'ACNS'
  programmeLabel: string
}

export const CAREERS: Record<CareerKey, Career> = {
  software: { key: 'software', title: 'Software Developer', summary: 'You build working applications by turning ideas and logic into code.', skills: ['Programming fundamentals', 'Problem solving', 'Databases', 'Version control'], nextSteps: ['Learn one language well, starting with the basics', 'Build three small projects', 'Join an APTECH programme for guided, project-based training'], programmeCode: 'ADSE', programmeLabel: 'Advanced Diploma in Software Engineering' },
  data: { key: 'data', title: 'Data Analyst', summary: 'You find patterns in numbers and turn them into decisions people can act on.', skills: ['Excel', 'SQL', 'Data visualisation', 'Python basics'], nextSteps: ['Practise reading tables and charts', 'Learn spreadsheet formulas, then SQL', 'Explore APTECH data and analytics tracks'], programmeCode: 'SMARTPRO', programmeLabel: 'Smart Professional Programmes (data & analytics tracks)' },
  web: { key: 'web', title: 'Web Developer', summary: 'You enjoy creating things people can see, click and use in a browser.', skills: ['HTML & CSS', 'JavaScript', 'Responsive design', 'Basic UX'], nextSteps: ['Build a one-page personal site', 'Learn how layouts adapt to phones', 'Move into structured web training at APTECH'], programmeCode: 'ADSE', programmeLabel: 'Advanced Diploma in Software Engineering' },
  database: { key: 'database', title: 'Database Developer', summary: 'You like structure and accuracy, and keeping information organised and reliable.', skills: ['SQL', 'Data modelling', 'Query optimisation', 'Data integrity'], nextSteps: ['Learn SELECT, WHERE and JOIN', 'Design a small student or shop database', 'Explore database modules in APTECH programmes'], programmeCode: 'ADSE', programmeLabel: 'Advanced Diploma in Software Engineering' },
  cyber: { key: 'cyber', title: 'Cybersecurity Professional', summary: 'You are alert to risk and enjoy protecting systems, networks and people.', skills: ['Networking basics', 'Operating systems', 'Threat awareness', 'Security practices'], nextSteps: ['Learn how networks and the web work', 'Practise spotting phishing and weak setups', 'Explore networking and security training at APTECH'], programmeCode: 'ACNS', programmeLabel: 'Aptech Certified Network Specialist' },
  marketing: { key: 'marketing', title: 'Digital Marketer', summary: 'You combine creativity with measurement to grow audiences online.', skills: ['Social & search marketing', 'Analytics', 'Content creation', 'Campaign planning'], nextSteps: ['Run a small campaign for a local business', 'Learn to read analytics dashboards', 'Ask APTECH about short professional tracks'], programmeCode: 'SMARTPRO', programmeLabel: 'Smart Professional Programmes' },
  bi: { key: 'bi', title: 'Business Intelligence Professional', summary: 'You connect data to business questions and present clear, visual answers.', skills: ['Dashboards', 'Excel & reporting', 'SQL', 'Business thinking'], nextSteps: ['Build a dashboard from a simple dataset', 'Learn to tell a story with charts', 'Explore APTECH analytics-focused tracks'], programmeCode: 'SMARTPRO', programmeLabel: 'Smart Professional Programmes (analytics tracks)' },
  design: { key: 'design', title: 'UI & Graphic Technology Pathway', summary: 'You have a visual eye and want to design interfaces and digital graphics.', skills: ['Layout & typography', 'Design tools', 'UI basics', 'Front-end awareness'], nextSteps: ['Redesign an app screen you use daily', 'Learn colour, spacing and hierarchy', 'Ask APTECH advisors which tracks suit visual work'], programmeCode: 'SMARTPRO', programmeLabel: 'Smart Professional Programmes' }
}

type Weights = Partial<Record<CareerKey, number>>
export type PathQuestion = { id: string; prompt: string; options: { label: string; emoji?: string; w: Weights; meta?: Record<string, string> }[] }

export const PATHFINDER_QUESTIONS: PathQuestion[] = [
  { id: 'enjoy', prompt: 'What do you enjoy doing most?', options: [
    { label: 'Building things from scratch', emoji: '🛠️', w: { software: 3, web: 2 } },
    { label: 'Finding patterns in information', emoji: '🔎', w: { data: 3, bi: 2, database: 1 } },
    { label: 'Making things look great', emoji: '🎨', w: { design: 3, web: 2, marketing: 1 } },
    { label: 'Keeping things safe and secure', emoji: '🛡️', w: { cyber: 3 } } ] },
  { id: 'mode', prompt: 'Do you prefer creating, analysing, solving or protecting?', options: [
    { label: 'Creating', emoji: '✨', w: { web: 2, design: 2, software: 1, marketing: 1 } },
    { label: 'Analysing', emoji: '📊', w: { data: 2, bi: 2, database: 1 } },
    { label: 'Solving', emoji: '🧩', w: { software: 2, database: 1, data: 1 } },
    { label: 'Protecting', emoji: '🔐', w: { cyber: 3 } } ] },
  { id: 'numbers', prompt: 'Do you enjoy working with numbers?', options: [
    { label: 'Yes, I love them', w: { data: 3, bi: 3, database: 1 } },
    { label: 'They are fine', w: { software: 1, database: 1, cyber: 1, marketing: 1 } },
    { label: 'I would rather avoid them', w: { design: 2, web: 1, marketing: 1 } } ] },
  { id: 'build', prompt: 'Do you enjoy building websites or apps?', options: [
    { label: 'Yes, that excites me', emoji: '💻', w: { web: 3, software: 3, design: 1 } },
    { label: 'Maybe, I want to try', w: { web: 1, software: 1, design: 1 } },
    { label: 'Not really', w: { data: 1, cyber: 1, bi: 1, marketing: 1 } } ] },
  { id: 'comfort', prompt: 'How comfortable are you with computers?', options: [
    { label: 'Beginner — still learning the basics', w: { marketing: 1, design: 1 }, meta: { level: 'beginner' } },
    { label: 'Comfortable with everyday tools', w: { data: 1, bi: 1, web: 1 }, meta: { level: 'comfortable' } },
    { label: 'Very comfortable — I like to tinker', w: { software: 1, cyber: 1, database: 1 }, meta: { level: 'advanced' } } ] },
  { id: 'time', prompt: 'How much time can you dedicate to learning?', options: [
    { label: 'A few hours a week', w: { marketing: 1, bi: 1 }, meta: { time: 'light' } },
    { label: 'Most weekdays', w: { data: 1, web: 1, design: 1 }, meta: { time: 'regular' } },
    { label: 'Full-time commitment', w: { software: 2, cyber: 1, database: 1 }, meta: { time: 'full' } } ] },
  { id: 'career', prompt: 'What type of career interests you?', options: [
    { label: 'Building products and software', w: { software: 2, web: 2 } },
    { label: 'Working with data and decisions', w: { data: 2, bi: 2, database: 1 } },
    { label: 'Creative and digital media', w: { design: 2, marketing: 2 } },
    { label: 'Security and infrastructure', w: { cyber: 3, database: 1 } } ] },
  { id: 'experience', prompt: 'Are you a complete beginner or do you already have experience?', options: [
    { label: 'Complete beginner', w: {}, meta: { exp: 'beginner' } },
    { label: 'I have tried a little', w: {}, meta: { exp: 'some' } },
    { label: 'I already have experience', w: { software: 1, data: 1, cyber: 1 }, meta: { exp: 'experienced' } } ] }
]

export const CAREER_QUIZ_QUESTIONS: PathQuestion[] = [
  { id: 'q1', prompt: 'A new gadget arrives. What do you do first?', options: [
    { label: 'Take it apart to see how it works', emoji: '🔧', w: { software: 2, cyber: 2 } },
    { label: 'Test every feature and note results', emoji: '📝', w: { data: 2, database: 2 } },
    { label: 'Customise how it looks', emoji: '🎨', w: { design: 2, web: 2 } },
    { label: 'Show friends and tell everyone', emoji: '📣', w: { marketing: 3 } } ] },
  { id: 'q2', prompt: 'Pick a weekend project.', options: [
    { label: 'Build a small app', emoji: '📱', w: { software: 3, web: 1 } },
    { label: 'Track and chart my spending', emoji: '📈', w: { data: 2, bi: 3 } },
    { label: 'Design a poster or website', emoji: '🖼️', w: { design: 3, web: 1 } },
    { label: 'Lock down my accounts', emoji: '🔒', w: { cyber: 3 } } ] },
  { id: 'q3', prompt: 'When something breaks, you…', options: [
    { label: 'Hunt for the root cause', emoji: '🕵️', w: { software: 2, cyber: 2, database: 1 } },
    { label: 'Check the data for clues', emoji: '📊', w: { data: 3, bi: 1 } },
    { label: 'Fix how it looks and feels', emoji: '💅', w: { design: 2, web: 2 } },
    { label: 'Explain it clearly to others', emoji: '🗣️', w: { marketing: 2, bi: 1 } } ] },
  { id: 'q4', prompt: 'Which sounds most satisfying?', options: [
    { label: 'Code that finally runs', w: { software: 3, web: 1 } },
    { label: 'A spreadsheet that explains everything', w: { data: 2, bi: 2, database: 1 } },
    { label: 'A page everyone loves', w: { web: 2, design: 2 } },
    { label: 'Stopping an attack', w: { cyber: 3 } } ] },
  { id: 'q5', prompt: 'How do you like to work?', options: [
    { label: 'Deep focus, alone', w: { software: 2, database: 2, cyber: 1 } },
    { label: 'With a team on a shared goal', w: { web: 1, marketing: 2, bi: 2 } },
    { label: 'A mix of both', w: { data: 1, design: 1, web: 1 } } ] },
  { id: 'q6', prompt: 'Choose a superpower.', options: [
    { label: 'See patterns nobody else sees', emoji: '🔮', w: { data: 3, bi: 1 } },
    { label: 'Build anything you imagine', emoji: '🏗️', w: { software: 2, web: 2 } },
    { label: 'Persuade anyone', emoji: '🎤', w: { marketing: 3 } },
    { label: 'Be un-hackable', emoji: '🛡️', w: { cyber: 3 } } ] }
]

export type Persona = { title: string; text: string }
export const PERSONAS: Record<string, Persona> = {
  builder: { title: 'You’re a Builder', text: 'You love making things work, from first idea to finished product.' },
  solver: { title: 'You’re a Problem Solver', text: 'You appear to enjoy analysing problems, finding patterns and creating practical solutions.' },
  creator: { title: 'You’re a Creator', text: 'You have an eye for design and enjoy shaping how people experience technology.' },
  guardian: { title: 'You’re a Guardian', text: 'You are alert, careful and motivated to protect systems and people.' },
  communicator: { title: 'You’re a Communicator', text: 'You connect people with ideas and know how to turn technology into stories that land.' }
}
const PERSONA_FOR: Record<CareerKey, string> = { software: 'builder', web: 'builder', data: 'solver', database: 'solver', bi: 'solver', design: 'creator', cyber: 'guardian', marketing: 'communicator' }

export type AnswerMap = Record<string, number>

export function scoreCareers(questions: PathQuestion[], answers: AnswerMap) {
  const totals: Record<string, number> = {}
  const meta: Record<string, string> = {}
  for (const q of questions) {
    const idx = answers[q.id]
    const opt = q.options[idx]
    if (!opt) continue
    for (const [k, v] of Object.entries(opt.w)) totals[k] = (totals[k] ?? 0) + (v ?? 0)
    if (opt.meta) Object.assign(meta, opt.meta)
  }
  const ranked = (Object.keys(CAREERS) as CareerKey[])
    .map((key) => ({ key, score: totals[key] ?? 0 }))
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))
  const maxPossible = Math.max(1, ranked[0]?.score ?? 1)
  const top = ranked.filter((r) => r.score > 0).slice(0, 3).map((r) => ({ ...r, match: Math.round((r.score / maxPossible) * 100) }))
  return { ranked, top, meta, persona: PERSONAS[PERSONA_FOR[top[0]?.key ?? 'software']] }
}

export function whyItMatches(questions: PathQuestion[], answers: AnswerMap, key: CareerKey): string[] {
  const reasons: { text: string; weight: number }[] = []
  for (const q of questions) {
    const opt = q.options[answers[q.id]]
    const weight = opt?.w[key] ?? 0
    if (opt && weight >= 2) reasons.push({ text: `${q.prompt.replace(/\?$/, '')} → “${opt.label}”`, weight })
  }
  return reasons.sort((a, b) => b.weight - a.weight).slice(0, 3).map((r) => r.text)
}

// ---------- Code Lab ----------
export type CodeTask = { id: string; title: string; brief: string; starter: string; check: { type: 'contains'; value: string; ignoreCase?: boolean }; hint: string; previewTemplate: string }
export const CODE_TASKS: CodeTask[] = [
  { id: 'hello', title: 'Make the button say “Hello APTECH!”', brief: 'The button below has no text yet. Type Hello APTECH! between the tags.', starter: '<button class="demo-btn"></button>', check: { type: 'contains', value: 'Hello APTECH!' }, hint: 'Put the words between <button …> and </button>.', previewTemplate: '{{code}}' },
  { id: 'heading', title: 'Change the heading', brief: 'Change the heading so it welcomes you by name — for example, Welcome, Ada!', starter: '<h1>Welcome, visitor</h1>', check: { type: 'contains', value: 'welcome,' , ignoreCase: true }, hint: 'Replace the word visitor, but keep the tags around it.', previewTemplate: '{{code}}' },
  { id: 'colour', title: 'Colour the text', brief: 'Make the text navy by changing the colour value in the style.', starter: '<p style="color: red">I will be a developer.</p>', check: { type: 'contains', value: 'color: navy', ignoreCase: true }, hint: 'Change red to navy.', previewTemplate: '{{code}}' }
]

// ---------- Spin to Learn ----------
export type SpinOutcome = { id: string; kind: 'tip' | 'mini' | 'fact' | 'programme' | 'bonus' | 'resource' | 'again'; label: string; title: string; body: string; href?: string; cta?: string; color: string }
export const SPIN_OUTCOMES: SpinOutcome[] = [
  { id: 'tip1', kind: 'tip', label: 'Tech Tip', title: 'Tech Tip', body: 'Use a password manager and a long passphrase. Reusing passwords is how one leak becomes many.', color: '#17307E' },
  { id: 'mini', kind: 'mini', label: 'Mini Challenge', title: 'Mini Challenge', body: 'Try a 60-second round and see how many questions you can land.', href: '/tech-playground/tech-iq', cta: 'Start the 60-Second Tech IQ', color: '#0F7A5C' },
  { id: 'fact', kind: 'fact', label: 'Career Fact', title: 'Career Fact', body: 'Data, software and security roles all reward people who can explain problems clearly, not only people who can code.', color: '#8A5A0A' },
  { id: 'prog', kind: 'programme', label: 'Programme Pick', title: 'Programme Recommendation', body: 'Curious where this could lead? Explore APTECH programmes and compare them side by side.', href: '/courses', cta: 'Explore programmes', color: '#112161' },
  { id: 'bonus', kind: 'bonus', label: 'Bonus Challenge', title: 'Bonus Challenge', body: 'Fix a broken page or query in the Tech Detective case files.', href: '/tech-playground/tech-detective', cta: 'Open case files', color: '#12946F' },
  { id: 'res', kind: 'resource', label: 'Learning Resource', title: 'Learning Resource', body: 'Practise by building one tiny thing: a page, a spreadsheet chart, or a SQL query. Small projects teach fastest.', href: '/tech-playground/code-lab', cta: 'Try the Code Lab', color: '#1F328B' },
  { id: 'tip2', kind: 'tip', label: 'Tech Tip', title: 'Tech Tip', body: 'When code fails, read the error message first. It usually names the line and the problem.', color: '#17307E' },
  { id: 'again', kind: 'again', label: 'Try Again', title: 'Spin Again!', body: 'No luck this time — give it another spin.', color: '#7E7690' }
]

// ---------- Badges ----------
export type BadgeKey = 'tech_explorer' | 'code_starter' | 'data_detective' | 'speed_champion' | 'challenge_master' | 'streak_7' | 'top_10'
export const BADGES: Record<BadgeKey, { title: string; emoji: string; how: string }> = {
  tech_explorer: { title: 'Tech Explorer', emoji: '🧭', how: 'Complete your first Tech Playground activity.' },
  code_starter: { title: 'Code Starter', emoji: '⌨️', how: 'Finish a Code Lab task.' },
  data_detective: { title: 'Data Detective', emoji: '🔍', how: 'Score 60% or more in Data Detective.' },
  speed_champion: { title: 'Speed Champion', emoji: '⚡', how: 'Score 70% or more in the 60-Second Tech IQ.' },
  challenge_master: { title: 'Challenge Master', emoji: '🏅', how: 'Score 80% or more in a Weekly Tech Challenge.' },
  streak_7: { title: '7-Day Tech Streak', emoji: '🔥', how: 'Complete all seven days of the Tech Streak.' },
  top_10: { title: 'Top 10 Competitor', emoji: '🏆', how: 'Reach the weekly Tech Arena top 10.' }
}

// ---------- Hub ----------
export type Experience = { title: string; text: string; href: string; tag: string; time: string; icon: string }
export const EXPERIENCES: Experience[] = [
  { title: 'Career Pathfinder', text: 'Discover the tech career and APTECH programme that fits you.', href: '/tech-playground/career-pathfinder', tag: 'Discover', time: '3 min', icon: 'compass' },
  { title: 'What Tech Career Fits You?', text: 'A fast personality quiz with a surprising result.', href: '/tech-playground/tech-career-quiz', tag: 'Quiz', time: '1 min', icon: 'sparkles' },
  { title: 'Weekly Tech Challenge', text: 'A fresh challenge every week. Beat the clock and the leaderboard.', href: '/tech-playground/weekly-challenge', tag: 'Weekly', time: '1 min', icon: 'flame' },
  { title: '60-Second Tech IQ', text: 'Rapid-fire questions across code, data, web and security.', href: '/tech-playground/tech-iq', tag: 'Speed', time: '1 min', icon: 'zap' },
  { title: 'Tech Detective', text: 'Find the bug, the flaw, or the threat before time runs out.', href: '/tech-playground/tech-detective', tag: 'Cases', time: '2 min', icon: 'search' },
  { title: 'Data Detective', text: 'Read the table like an analyst and draw the right conclusion.', href: '/tech-playground/data-detective', tag: 'Data', time: '3 min', icon: 'chart' },
  { title: 'Code Your First Thing', text: 'Write your first lines of code in your browser. No account needed.', href: '/tech-playground/code-lab', tag: 'Hands-on', time: '2 min', icon: 'code' },
  { title: '7-Day Tech Streak', text: 'One small challenge a day for a week. Earn the Tech Explorer badge.', href: '/tech-playground/7-day-challenge', tag: 'Streak', time: '1 min/day', icon: 'calendar' },
  { title: 'Spin to Learn', text: 'Spin the wheel for a tip, fact or mini challenge. Just for fun.', href: '/tech-playground/spin-to-learn', tag: 'Fun', time: '30 sec', icon: 'wheel' },
  { title: 'Tech Arena Leaderboard', text: 'See who is leading today, this week, this month and all time.', href: '/tech-playground/leaderboard', tag: 'Compete', time: '', icon: 'trophy' },
  { title: 'My Badges', text: 'View the badges you have earned on this device.', href: '/tech-playground/badges', tag: 'Rewards', time: '', icon: 'badge' }
]

export const DETECTIVE_CASES = [
  { category: 'code', title: 'Code Detective', text: 'Find the bug in short code snippets.' },
  { category: 'web', title: 'Web Detective', text: 'Diagnose what is wrong with a page.' },
  { category: 'sql', title: 'SQL Detective', text: 'Spot the problem in a query.' },
  { category: 'cyber', title: 'Cyber Detective', text: 'Identify suspicious behaviour.' },
  { category: 'data', title: 'Data Detective', text: 'Analyse a dataset and find the right result.' }
] as const

export const STREAK_DAY_TITLES = ['Digital Skills', 'Programming', 'Data', 'Web', 'Database', 'Cybersecurity', 'Final Challenge']
