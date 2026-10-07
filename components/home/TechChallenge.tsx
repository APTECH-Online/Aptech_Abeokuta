'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, RotateCcw, Timer } from 'lucide-react'
import AdvisorGuide from './AdvisorGuide'
import { trackConversionEvent } from '../../lib/conversion-events'

const QUESTIONS = [
  { q: 'Which technology is primarily used to structure a webpage?', options: ['HTML', 'SQL', 'Python', 'Excel'], answer: 0 },
  { q: 'What does a database help you do?', options: ['Store and organise information', 'Design a logo', 'Charge a phone', 'Print a keyboard'], answer: 0 },
  { q: 'Which is a programming language?', options: ['Python', 'Wi-Fi', 'HDMI', 'Bluetooth'], answer: 0 },
  { q: 'What is cybersecurity mainly concerned with?', options: ['Protecting systems and information', 'Making websites colourful', 'Typing faster', 'Replacing batteries'], answer: 0 },
  { q: 'Which skill is especially useful when working with data?', options: ['Analysis', 'Guessing', 'Ignoring patterns', 'Avoiding numbers'], answer: 0 }
]

export default function TechChallenge({ whatsapp }: { whatsapp: string }) {
  const [active, setActive] = useState(false)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)

  useEffect(() => {
    if (!active || finished) return
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          trackConversionEvent('tech_challenge_completed', { score })
          setFinished(true)
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [active, finished])

  function choose(choice: number) {
    const nextScore = score + (choice === QUESTIONS[index].answer ? 1 : 0)
    if (index === QUESTIONS.length - 1) { setScore(nextScore); setFinished(true); trackConversionEvent('tech_challenge_completed', { score: nextScore }); window.dispatchEvent(new CustomEvent('aptech:conversion', { detail: { event: 'tech_challenge_completed', score: nextScore } })); return }
    setScore(nextScore); setIndex(index + 1)
  }

  function reset() { setActive(false); setIndex(0); setScore(0); setFinished(false); setTimeLeft(60) }

  if (!active) return <div className="tech-challenge"><div><p className="eyebrow">Tech IQ Challenge</p><h2 className="h-section mt-2">Can you beat the tech challenge?</h2><p className="mt-2 lede" style={{ fontSize: '.96rem' }}>Five quick questions. Test your technology instincts and see your score at the end.</p></div><button type="button" className="btn btn-primary inline-flex items-center gap-2" onClick={() => { setTimeLeft(60); setActive(true); trackConversionEvent('tech_challenge_started'); window.dispatchEvent(new CustomEvent('aptech:conversion', { detail: { event: 'tech_challenge_started' } })) }}>Start the challenge <ArrowRight size={15} /></button></div>

  if (finished) {
    const message = score >= 4 ? 'Nice! You’ve got strong technology instincts.' : score >= 3 ? 'Good start — you’ve got a solid technology foundation.' : 'Curious minds improve quickly. Keep exploring.'
    const share = () => { const text = `I scored ${score}/5 on the APTECH Abeokuta Tech Challenge!`; if (navigator.share) void navigator.share({ text, url: window.location.href }); else void navigator.clipboard?.writeText(text) }
    return <div className="tech-challenge tech-challenge--result"><div className="program-finder__result-icon" aria-hidden="true"><Check size={22} /></div><p className="eyebrow">Final score</p><h2 className="h-section mt-2" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>{score} / 5</h2><p className="mt-2" style={{ color: 'var(--color-body)' }}>{message}</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/#programme-discovery" className="btn btn-primary">Discover Your Programme <ArrowRight size={15} /></Link><AdvisorGuide whatsapp={whatsapp} /><button type="button" onClick={share} className="btn btn-secondary">Share my score</button><button type="button" onClick={reset} className="btn btn-ghost"><RotateCcw size={14} /> Try again</button></div></div>
  }

  const current = QUESTIONS[index]
  return <div className="tech-challenge"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Question {index + 1} of 5</p><h2 className="h-section mt-2" style={{ fontSize: '1.35rem' }}>{current.q}</h2></div><div className="tech-challenge__timer"><Timer size={15} /> {timeLeft}s</div></div><div className="program-finder__progress mt-5"><span style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }} /></div><div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">{current.options.map((option, i) => <button key={option} type="button" onClick={() => choose(i)} className="program-finder__option"><span className="program-finder__step" style={{ width: 30, height: 30, fontSize: '.75rem' }} aria-hidden="true">{String.fromCharCode(65 + i)}</span><span className="program-finder__option-copy">{option}</span><ArrowRight size={16} className="program-finder__option-arrow" /></button>)}</div></div>
}
