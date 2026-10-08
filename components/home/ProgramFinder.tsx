'use client'

import ConsentFields from '../shared/ConsentFields'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart3, BriefcaseBusiness, Check, ChevronLeft, Code2, Compass, Cpu, GraduationCap, Laptop, Layers, Lightbulb, Network, Palette, Puzzle, RotateCcw, Rocket, Sparkles, Sprout, TrendingUp, Repeat, Users, Wrench, Gauge } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Course } from '../../data/courses'
import { rankRecommendations, type DiscoveryAnswers, getCareerDirection } from '../../lib/program-recommendation'
import { submitCareerQuizLead, type QuizLeadState } from '../../app/(site)/admissions/quiz-actions'
import AdvisorGuide from './AdvisorGuide'
import { trackConversionEvent } from '../../lib/conversion-events'
import IconTile from '../ui/IconTile'

const QUESTIONS = [
  { key: 'interest', title: 'What interests you most?', options: [['websites', 'Building websites and applications'], ['data', 'Working with data and insights'], ['experiences', 'Creating digital experiences'], ['technology', 'Understanding how technology works'], ['business', 'Business and productivity technology'], ['exploring', 'I’m not sure yet']] },
  { key: 'enjoyment', title: 'What do you enjoy doing most?', options: [['solving', 'Solving problems'], ['creating', 'Creating things'], ['analysing', 'Analysing information'], ['people', 'Working with people'], ['exploring', 'Exploring technology'], ['tools', 'Learning new tools']] },
  { key: 'goal', title: 'What is your main goal?', options: [['career', 'Start a technology career'], ['skills', 'Upgrade my current skills'], ['change-career', 'Change careers'], ['academic', 'Improve my academic/professional opportunities'], ['freelance', 'Start freelancing or a digital business'], ['exploring', 'I’m exploring my options']] },
  { key: 'experience', title: 'How would you describe your current technology experience?', options: [['beginner', 'Beginner'], ['some', 'Some experience'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']] },
  { key: 'excitement', title: 'Which sounds most exciting to you?', options: [['software', 'Building software'], ['data', 'Analysing data'], ['websites', 'Creating websites'], ['experiences', 'Designing digital experiences'], ['business', 'Working with business technology'], ['technology', 'Artificial intelligence and emerging technology']] }
] as const

type Props = { courses: Course[]; whatsapp: string }
const initialState: QuizLeadState = { status: 'idle' }

// Icon per answer (by question + option id) so each card has meaningful, consistent iconography.
const ICONS: Record<string, Record<string, LucideIcon>> = {
  interest: { websites: Code2, data: BarChart3, experiences: Palette, technology: Network, business: BriefcaseBusiness, exploring: Compass },
  enjoyment: { solving: Puzzle, creating: Lightbulb, analysing: BarChart3, people: Users, exploring: Compass, tools: Wrench },
  goal: { career: Rocket, skills: TrendingUp, 'change-career': Repeat, academic: GraduationCap, freelance: Laptop, exploring: Compass },
  experience: { beginner: Sprout, some: Layers, intermediate: Gauge, advanced: Cpu },
  excitement: { software: Code2, data: BarChart3, websites: Laptop, experiences: Palette, business: BriefcaseBusiness, technology: Cpu }
}

// One-line supporting copy, used only where it improves clarity (question 1).
const DESCRIPTIONS: Record<string, Record<string, string>> = {
  interest: {
    websites: 'Create websites, web apps and digital products',
    data: 'Work with data, analysis and business intelligence',
    experiences: 'Explore design, graphics and creative technology',
    technology: 'Understand networks, systems and how technology works',
    business: 'Build practical workplace and productivity skills',
    exploring: 'Help me discover where I should start'
  }
}

export default function ProgramFinder({ courses, whatsapp }: Props) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<DiscoveryAnswers>>({})
  const [submittedAnswers, setSubmittedAnswers] = useState<DiscoveryAnswers | null>(null)
  const [state, setState] = useState<QuizLeadState>(initialState)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const timer = useRef<number | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(false)

  const ranked = useMemo(() => submittedAnswers ? rankRecommendations(courses, submittedAnswers) : [], [courses, submittedAnswers])
  const recommended = ranked[0] ?? null
  const secondary = ranked[1] ?? null
  const question = QUESTIONS[step]

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  // Move focus to the new question after a step change (not on first paint) so keyboard / screen-reader users follow the flow.
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    headingRef.current?.focus({ preventScroll: true })
  }, [step])

  useEffect(() => {
    if (state.status === 'success') {
      window.dispatchEvent(new CustomEvent('aptech:conversion', { detail: { event: 'lead_submitted', source: 'career_quiz' } }))
    }
  }, [state.status])

  function choose(value: string) {
    if (pending) return
    const next = { ...answers, [question.key]: value } as Partial<DiscoveryAnswers>
    setAnswers(next)
    setPending(value)
    window.dispatchEvent(new CustomEvent('aptech:conversion', { detail: { event: step === 0 ? 'quiz_started' : 'quiz_step_completed', step: step + 1 } }))
    if (step === 0) trackConversionEvent('career_quiz_started')
    // Short pause so the selected state is visible before auto-advancing (skipped for reduced motion).
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    timer.current = window.setTimeout(() => {
      setPending(null)
      if (step < QUESTIONS.length - 1) setStep(step + 1)
      else { setSubmittedAnswers(next as DiscoveryAnswers); trackConversionEvent('career_quiz_recommendation_viewed') }
    }, reduce ? 0 : 260)
  }

  function reset() {
    if (timer.current) window.clearTimeout(timer.current)
    setPending(null); setStep(0); setAnswers({}); setSubmittedAnswers(null); setName(''); setPhone(''); setEmail('')
  }

  if (!submittedAnswers || !recommended) {
    const count = question.options.length
    const selectedValue = pending ?? (answers as Record<string, string | undefined>)[question.key]
    return (
      <div className="pf">
        <div className="pf__glow" aria-hidden="true" />
        <div className="pf__dots" aria-hidden="true" />
        <div className="pf__inner">
          <div className="pf__meta">
            <p className="pf__step-label"><span>Question</span> {String(step + 1).padStart(2, '0')} <span>of</span> {String(QUESTIONS.length).padStart(2, '0')}</p>
            <div className="pf__progress" role="progressbar" aria-label="Programme finder progress" aria-valuemin={1} aria-valuemax={QUESTIONS.length} aria-valuenow={step + 1} aria-valuetext={`Question ${step + 1} of ${QUESTIONS.length}`}>
              {QUESTIONS.map((q, i) => <span key={q.key} className={i < step ? 'is-done' : i === step ? 'is-current' : ''} />)}
            </div>
          </div>
          <h3 ref={headingRef} tabIndex={-1} className="pf__question">{question.title}</h3>
          <p className="pf__sr" aria-live="polite">Question {step + 1} of {QUESTIONS.length}: {question.title}</p>
          <div className={`pf__options pf__options--${count >= 6 ? 'six' : 'four'}`} role="group" aria-label={question.title}>
            {question.options.map(([id, label]) => {
              const Icon = ICONS[question.key]?.[id] ?? Sparkles
              const desc = DESCRIPTIONS[question.key]?.[id]
              const selected = selectedValue === id
              return (
                <button key={id} type="button" onClick={() => choose(id)} aria-pressed={selected} className={`pf-option${selected ? ' is-selected' : ''}`}>
                  <IconTile icon={Icon} />
                  <span className="pf-option__copy"><span className="pf-option__title">{label}</span>{desc && <span className="pf-option__desc">{desc}</span>}</span>
                  <span className="pf-option__check" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>
                </button>
              )
            })}
          </div>
          <div className="pf__footer">
            <p className="pf__hint"><Sparkles size={14} aria-hidden="true" /> Your recommendation comes first. We only ask for details afterwards.</p>
            {step > 0 ? <button type="button" onClick={() => { if (pending) return; setStep(step - 1) }} className="pf__back"><ChevronLeft size={15} aria-hidden="true" /> Back</button> : <span className="pf__auto">Select an option to continue <ArrowRight size={14} aria-hidden="true" /></span>}
          </div>
        </div>
      </div>
    )
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    data.set('programmeId', recommended.slug)
    data.set('programmeName', recommended.title)
    data.set('answers', JSON.stringify(submittedAnswers))
    void submitCareerQuizLead(initialState, data).then(setState)
  }

  return (
    <div className="pf pf--result">
      <div className="pf__glow" aria-hidden="true" />
      <div className="pf__dots" aria-hidden="true" />
      <div className="pf__inner">
      <div className="pf-result__badge"><Check size={14} strokeWidth={3} aria-hidden="true" /> Personalised recommendation</div>
      <p className="eyebrow mt-4">Your recommended path</p>
      <h3 className="h-section mt-2" style={{ fontSize: 'clamp(1.5rem, 2.4vw, 2rem)' }}>{recommended.title}</h3>
      <p className="mt-3 leading-relaxed" style={{ color: 'var(--color-body)' }}>Based on your answers, this programme appears to be a strong match for your interests and goals.</p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[['Relevant skills', recommended.outcomes.slice(0, 2).join(' · ') || 'Practical technology skills'], ['Career direction', getCareerDirection(recommended)], ['Level', recommended.level]].map(([label, value]) => <div key={label} className="pf-meta"><p>{label}</p><strong>{value}</strong></div>)}
      </div>
      <div className="mt-7 flex flex-wrap gap-3 items-center">
        <Link href={`/courses/${recommended.slug}`} onClick={() => window.dispatchEvent(new CustomEvent('aptech:conversion', { detail: { event: 'programme_cta_clicked', programme: recommended.slug } }))} className="btn btn-secondary inline-flex items-center gap-1.5">Explore This Programme <ArrowRight size={15} aria-hidden="true" /></Link>
        <AdvisorGuide whatsapp={whatsapp} programmeName={recommended.title} />
        <button type="button" onClick={reset} className="btn btn-ghost inline-flex items-center gap-1.5"><RotateCcw size={14} aria-hidden="true" /> Start over</button>
      </div>

      {secondary && <div className="mt-7 pt-5 border-t" style={{ borderColor: 'var(--color-line)' }}><p className="eyebrow">Also worth exploring</p><Link href={`/courses/${secondary.slug}`} className="font-semibold text-sm inline-flex items-center gap-1 mt-1" style={{ color: 'var(--color-navy-700)' }}>{secondary.title} <ArrowRight size={14} /></Link></div>}

      <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--color-line)' }}>
        <p className="eyebrow">Want help choosing your next step?</p>
        <p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--color-body)' }}>Leave your details and an APTECH Abeokuta academic advisor can help you understand the programme, admission process and next steps.</p>
        {state.status === 'success' ? <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(19,166,136,.08)', border: '1px solid rgba(19,166,136,.22)' }}><strong>Thanks — your quiz result is now with the admissions team.</strong>{state.leadReference && <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Reference: {state.leadReference}</p>}</div> : <form onSubmit={submit} className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3" noValidate>
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} required className="field-input" placeholder="Full name *" aria-label="Full name" />
          <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="field-input" placeholder="WhatsApp / phone" aria-label="WhatsApp or phone" />
          <input name="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="field-input" placeholder="Email" aria-label="Email" />
          <div className="sm:col-span-3"><ConsentFields compact /></div>
          <div className="sm:col-span-3 flex flex-wrap items-center gap-3"><button type="submit" disabled={!name.trim()} className="btn btn-primary disabled:opacity-50">Send my result <ArrowRight size={15} /></button>{state.status === 'error' && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{state.message}</p>}</div>
        </form>}
      </div>
      </div>
    </div>
  )
}
