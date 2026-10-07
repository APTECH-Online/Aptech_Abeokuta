'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, RotateCcw, Sparkles, Timer, Trophy } from 'lucide-react'
import AdvisorGuide from './AdvisorGuide'
import TechIqLeadCapture from './TechIqLeadCapture'
import { trackConversionEvent } from '../../lib/conversion-events'

const QUESTIONS = [
  { q: 'Which technology is primarily used to structure a webpage?', options: ['HTML', 'SQL', 'Python', 'Excel'], answer: 0 },
  { q: 'What does a database help you do?', options: ['Store and organise information', 'Design a logo', 'Charge a phone', 'Print a keyboard'], answer: 0 },
  { q: 'Which is a programming language?', options: ['Python', 'Wi-Fi', 'HDMI', 'Bluetooth'], answer: 0 },
  { q: 'What is cybersecurity mainly concerned with?', options: ['Protecting systems and information', 'Making websites colourful', 'Typing faster', 'Replacing batteries'], answer: 0 },
  { q: 'Which skill is especially useful when working with data?', options: ['Analysis', 'Guessing', 'Ignoring patterns', 'Avoiding numbers'], answer: 0 }
]

function getLevel(score: number) {
  if (score === 5) return 'Tech Pro'
  if (score >= 4) return 'Skilled'
  if (score >= 3) return 'Explorer'
  return 'Beginner'
}

function getMessage(score: number) {
  if (score === 5) return 'Excellent technology instincts. You moved through the challenge with confidence.'
  if (score >= 4) return 'Strong performance. You have a solid foundation across core technology concepts.'
  if (score >= 3) return 'Good start. Keep exploring and you can quickly build a stronger technology foundation.'
  return 'Every tech journey starts somewhere. Use this result as a starting point and keep learning.'
}

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
  }, [active, finished, score])

  function start() {
    setTimeLeft(60)
    setIndex(0)
    setScore(0)
    setFinished(false)
    setActive(true)
    trackConversionEvent('tech_challenge_started')
    window.dispatchEvent(new CustomEvent('aptech:conversion', { detail: { event: 'tech_challenge_started' } }))
  }

  function choose(choice: number) {
    const nextScore = score + (choice === QUESTIONS[index].answer ? 1 : 0)
    if (index === QUESTIONS.length - 1) {
      setScore(nextScore)
      setFinished(true)
      trackConversionEvent('tech_challenge_completed', { score: nextScore })
      window.dispatchEvent(new CustomEvent('aptech:conversion', { detail: { event: 'tech_challenge_completed', score: nextScore } }))
      return
    }
    setScore(nextScore)
    setIndex(index + 1)
  }

  function reset() {
    setActive(false)
    setIndex(0)
    setScore(0)
    setFinished(false)
    setTimeLeft(60)
  }

  if (!active) {
    return (
      <div className="tech-challenge tech-challenge--intro">
        <div className="tech-challenge__intro-glow" aria-hidden="true" />
        <div className="tech-challenge__intro-main">
          <div className="tech-challenge__badge"><Sparkles size={14} /> Tech IQ Challenge</div>
          <p className="eyebrow mt-5">Quick technology assessment</p>
          <h2 className="h-display mt-2">Can you beat the tech challenge?</h2>
          <p className="lede mt-3">Five quick questions designed to test your technology instincts, digital awareness and problem-solving mindset.</p>
          <div className="tech-challenge__meta mt-6">
            <span><strong>05</strong> questions</span>
            <span><strong>60s</strong> time limit</span>
            <span><strong>4</strong> result levels</span>
          </div>
        </div>
        <div className="tech-challenge__intro-actions">
          <button type="button" className="btn btn-primary" onClick={start}>Start the challenge <ArrowRight size={15} /></button>
          <Link href="/tech-zone" className="btn btn-secondary">Explore Tech Zone</Link>
          <p>Play first. Your result comes at the end.</p>
        </div>
      </div>
    )
  }

  if (finished) {
    const level = getLevel(score)
    const message = getMessage(score)
    const percentage = score * 20
    const share = () => {
      const text = `I scored ${score}/5 on the APTECH Abeokuta Tech IQ Challenge!`
      if (navigator.share) void navigator.share({ text, url: window.location.href })
      else void navigator.clipboard?.writeText(text)
    }
    return (
      <div className="tech-challenge tech-challenge--result">
        <div className="tech-challenge__result-top">
          <div className="program-finder__result-icon" aria-hidden="true"><Trophy size={22} /></div>
          <div><p className="eyebrow">Challenge complete</p><span className="tech-challenge__result-label">Your Tech IQ</span></div>
        </div>
        <div className="tech-challenge__score-wrap">
          <div className="tech-challenge__score-ring" style={{ '--score': `${percentage}%` } as CSSProperties}>
            <strong>{percentage}%</strong>
            <span>{score}/5 correct</span>
          </div>
          <div>
            <p className="tech-challenge__level">{level}</p>
            <h2 className="h-section mt-1">Nice work.</h2>
            <p className="mt-2" style={{ color: 'var(--color-body)' }}>{message}</p>
          </div>
        </div>
        <div className="tech-challenge__result-note">
          <Check size={16} aria-hidden="true" />
          <span>This is an informal challenge result — a fun indication of your current technology awareness, not a professional aptitude assessment.</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href="/#programme-discovery" className="btn btn-primary">Discover Your Programme <ArrowRight size={15} /></Link>
          <AdvisorGuide whatsapp={whatsapp} />
          <TechIqLeadCapture score={score} />
          <button type="button" onClick={share} className="btn btn-secondary">Share my score</button>
          <button type="button" onClick={reset} className="btn btn-ghost"><RotateCcw size={14} /> Try again</button>
        </div>
      </div>
    )
  }

  const current = QUESTIONS[index]
  const progress = ((index + 1) / QUESTIONS.length) * 100
  return (
    <div className="tech-challenge tech-challenge--game">
      <div className="tech-challenge__gamebar">
        <div>
          <p className="eyebrow">Tech IQ · Round {index + 1}</p>
          <p className="tech-challenge__question-count">Question {index + 1} <span>of {QUESTIONS.length}</span></p>
        </div>
        <div className={`tech-challenge__timer${timeLeft <= 10 ? ' is-low' : ''}`} aria-label={`${timeLeft} seconds remaining`}><Timer size={15} /> {timeLeft}s</div>
      </div>
      <div className="tech-challenge__progress" aria-label={`Question ${index + 1} of ${QUESTIONS.length}`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="tech-challenge__question-card">
        <span className="tech-challenge__question-number">0{index + 1}</span>
        <p className="eyebrow">Choose the best answer</p>
        <h2 className="h-section mt-3">{current.q}</h2>
      </div>
      <div className="tech-challenge__answers">
        {current.options.map((option, i) => (
          <button key={option} type="button" onClick={() => choose(i)} className="tech-challenge__answer">
            <span className="tech-challenge__answer-key" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
            <span className="program-finder__option-copy">{option}</span>
            <ArrowRight size={16} className="program-finder__option-arrow" aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="tech-challenge__game-foot">Trust your first good answer. You can’t go back once you choose.</p>
    </div>
  )
}
