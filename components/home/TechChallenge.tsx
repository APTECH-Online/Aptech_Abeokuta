'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart3, Check, Code2, RotateCcw, Sparkles, Target, Timer, Trophy } from 'lucide-react'
import AdvisorGuide from './AdvisorGuide'
import TechIqLeadCapture from './TechIqLeadCapture'
import { trackConversionEvent } from '../../lib/conversion-events'

const QUESTION_BANK = [
  { id: 'web-html', q: 'Which technology is primarily used to structure a webpage?', options: ['HTML', 'SQL', 'Python', 'Excel'], answer: 0 },
  { id: 'database-purpose', q: 'What does a database help you do?', options: ['Store and organise information', 'Design a logo', 'Charge a phone', 'Print a keyboard'], answer: 0 },
  { id: 'programming-language', q: 'Which of these is a programming language?', options: ['Python', 'Wi-Fi', 'HDMI', 'Bluetooth'], answer: 0 },
  { id: 'cybersecurity', q: 'What is cybersecurity mainly concerned with?', options: ['Protecting systems and information', 'Making websites colourful', 'Typing faster', 'Replacing batteries'], answer: 0 },
  { id: 'data-analysis', q: 'Which skill is especially useful when working with data?', options: ['Analysis', 'Guessing', 'Ignoring patterns', 'Avoiding numbers'], answer: 0 },
  { id: 'css', q: 'What is CSS mainly used for on a website?', options: ['Styling and presentation', 'Storing customer records', 'Writing SQL queries', 'Sending emails'], answer: 0 },
  { id: 'sql-select', q: 'Which SQL command is commonly used to retrieve data from a table?', options: ['SELECT', 'PAINT', 'FETCHFILE', 'DISPLAY'], answer: 0 },
  { id: 'cloud', q: 'What does cloud computing generally allow you to do?', options: ['Use computing resources over the internet', 'Make a computer physically smaller', 'Remove the need for passwords', 'Turn every file into an image'], answer: 0 },
  { id: 'algorithm', q: 'What is an algorithm?', options: ['A step-by-step method for solving a problem', 'A type of computer screen', 'A physical storage device', 'A website address'], answer: 0 },
  { id: 'password', q: 'Which is the strongest password practice?', options: ['Use a unique, long password for each important account', 'Use your first name everywhere', 'Reuse one short password', 'Share passwords with friends'], answer: 0 },
  { id: 'api', q: 'What is an API commonly used for?', options: ['Allowing software systems to communicate', 'Increasing monitor brightness', 'Cleaning a keyboard', 'Printing documents faster'], answer: 0 },
  { id: 'spreadsheet', q: 'What is a spreadsheet especially useful for?', options: ['Organising, calculating and analysing data', 'Replacing an operating system', 'Encrypting every website', 'Building a computer case'], answer: 0 },
  { id: 'binary', q: 'Which two digits are used in the binary number system?', options: ['0 and 1', '1 and 2', '2 and 3', '8 and 9'], answer: 0 },
  { id: 'frontend', q: 'Which area of web development focuses mainly on what users see and interact with?', options: ['Frontend development', 'Database administration', 'Network cabling', 'Hardware repair'], answer: 0 },
  { id: 'backend', q: 'What is backend development commonly responsible for?', options: ['Server-side logic and data processing', 'Choosing a laptop colour', 'Taking profile photos', 'Adjusting screen brightness'], answer: 0 },
  { id: 'backup', q: 'Why are backups important?', options: ['They help recover data after loss or damage', 'They make passwords unnecessary', 'They guarantee a faster internet connection', 'They prevent every cyberattack'], answer: 0 },
  { id: 'phishing', q: 'What is phishing?', options: ['A deceptive attempt to obtain sensitive information', 'A method for compressing images', 'A programming language', 'A database sorting method'], answer: 0 },
  { id: 'version-control', q: 'What is version control useful for?', options: ['Tracking changes to files and collaborating on code', 'Increasing Wi-Fi signal strength', 'Designing computer hardware', 'Charging a laptop'], answer: 0 },
  { id: 'machine-learning', q: 'What is machine learning broadly about?', options: ['Systems learning patterns from data', 'Replacing every database with a spreadsheet', 'Making internet cables wireless', 'Turning websites into PDFs'], answer: 0 },
  { id: 'database-key', q: 'In a database, what does a primary key help identify?', options: ['A unique record', 'The colour of a table', 'The website logo', 'The size of a monitor'], answer: 0 },
  { id: 'debugging', q: 'What does debugging mean in programming?', options: ['Finding and fixing errors in code', 'Designing a new keyboard', 'Deleting all source code', 'Installing a monitor'], answer: 0 },
  { id: 'responsive', q: 'What does a responsive website do?', options: ['Adapts its layout to different screen sizes', 'Responds only to emails', 'Requires a different database for every phone', 'Blocks mobile users'], answer: 0 },
  { id: 'encryption', q: 'What is encryption designed to do?', options: ['Protect information by transforming it into an encoded form', 'Make files larger for storage', 'Improve speaker volume', 'Remove all computer viruses'], answer: 0 },
  { id: 'git', q: 'Which tool is widely used for distributed version control?', options: ['Git', 'Excel', 'PowerPoint', 'Bluetooth'], answer: 0 },
  { id: 'loop', q: 'In programming, what is a loop commonly used for?', options: ['Repeating a set of instructions', 'Deleting an operating system', 'Connecting a monitor', 'Creating a password automatically'], answer: 0 },
  { id: 'network', q: 'What does a computer network allow devices to do?', options: ['Communicate and share resources', 'Turn electricity into water', 'Remove the need for software', 'Make every file public'], answer: 0 },
  { id: 'ux', q: 'What does UX stand for in digital product design?', options: ['User Experience', 'Universal XML', 'User Export', 'Utility Extension'], answer: 0 },
  { id: 'data-visualisation', q: 'Why might a data visualisation be useful?', options: ['It can make patterns and trends easier to understand', 'It guarantees that data is correct', 'It replaces all analysis', 'It prevents data from changing'], answer: 0 },
  { id: 'two-factor', q: 'What does two-factor authentication add to a login?', options: ['A second verification step', 'A second username only', 'A faster internet connection', 'A public password'], answer: 0 },
  { id: 'open-source', q: 'What does open-source software generally mean?', options: ['Its source code is available under terms that allow inspection and often modification', 'It can only run without the internet', 'It has no licence', 'It must always be free of charge'], answer: 0 },
  { id: 'logic', q: 'If all developers solve problems and Ada is a developer, what follows?', options: ['Ada solves problems', 'Ada is a database', 'Ada cannot code', 'Nothing can be concluded'], answer: 0 },
  { id: 'file-format', q: 'Which file format is commonly used for structured, tabular data?', options: ['CSV', 'MP3', 'PNG', 'MP4'], answer: 0 },
  { id: 'browser', q: 'Which of these is a web browser?', options: ['Chrome', 'Python', 'PostgreSQL', 'Git'], answer: 0 },
  { id: 'database-query', q: 'What is a database query?', options: ['A request for information or an operation on stored data', 'A type of monitor', 'A physical network cable', 'A password manager'], answer: 0 },
  { id: 'software-update', q: 'Why should important software be kept up to date?', options: ['Updates can fix bugs and security vulnerabilities', 'Updates always remove all user data', 'Updates eliminate the need for backups', 'Updates make passwords unnecessary'], answer: 0 },
  { id: 'input-output', q: 'Which is an example of an input device?', options: ['Keyboard', 'Monitor', 'Speaker', 'Projector'], answer: 0 },
  { id: 'logic-condition', q: 'What does an IF statement usually allow a program to do?', options: ['Make a decision based on a condition', 'Store every file permanently', 'Connect to Wi-Fi automatically', 'Draw a logo'], answer: 0 },
  { id: 'database-relation', q: 'In a relational database, what does a table normally contain?', options: ['Rows and columns of related data', 'Only images', 'Only passwords', 'Computer cables'], answer: 0 },
  { id: 'digital-footprint', q: 'What is a digital footprint?', options: ['The trail of information created by your online activity', 'A physical mark left by a laptop', 'A type of computer virus', 'A database index'], answer: 0 },
] as const

type TechIqQuestion = (typeof QUESTION_BANK)[number]
type TechIqAttemptQuestion = { id: string; q: string; options: string[]; answer: number }
const QUESTIONS_PER_ATTEMPT = 5
const RECENT_QUESTION_STORAGE_KEY = 'aptech-tech-iq-recent-questions'
const RECENT_QUESTION_LIMIT = 15

function randomQuestions(): TechIqQuestion[] {
  let recentList: string[] = []
  try {
    const raw = window.localStorage.getItem(RECENT_QUESTION_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    recentList = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    recentList = []
  }
  const recentIds = new Set(recentList)

  const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5)
  const fresh = shuffled.filter((question) => !recentIds.has(question.id))
  const pool = fresh.length >= QUESTIONS_PER_ATTEMPT ? fresh : shuffled
  const selected = pool.slice(0, QUESTIONS_PER_ATTEMPT)

  const randomized = selected.map((question): TechIqAttemptQuestion => {
    const options = question.options.map((text, index) => ({ text, isCorrect: index === question.answer }))
    options.sort(() => Math.random() - 0.5)
    return {
      id: question.id,
      q: question.q,
      options: options.map((option) => option.text),
      answer: options.findIndex((option) => option.isCorrect),
    }
  })

  try {
    const nextRecent = [...recentList, ...selected.map((question) => question.id)].slice(-RECENT_QUESTION_LIMIT)
    window.localStorage.setItem(RECENT_QUESTION_STORAGE_KEY, JSON.stringify(nextRecent))
  } catch {
    // Random selection still works if browser storage is unavailable.
  }

  return randomized
}


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

const journeySteps = [
  { number: '01', title: 'Enter', copy: 'Get set for five quick questions.', icon: Code2, tone: 'blue' },
  { number: '02', title: 'Think', copy: 'Trust your instincts and solve each one.', icon: BarChart3, tone: 'teal' },
  { number: '03', title: 'Discover', copy: 'See your Tech IQ and choose what comes next.', icon: Target, tone: 'purple' },
] as const

export default function TechChallenge({ whatsapp }: { whatsapp: string }) {
  const [active, setActive] = useState(false)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [questions, setQuestions] = useState<TechIqAttemptQuestion[]>([])

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
    setQuestions(randomQuestions())
    setFinished(false)
    setActive(true)
    trackConversionEvent('tech_challenge_started')
    window.dispatchEvent(new CustomEvent('aptech:conversion', { detail: { event: 'tech_challenge_started' } }))
  }

  function choose(choice: number) {
    const currentQuestion = questions[index]
    const nextScore = score + (choice === currentQuestion.answer ? 1 : 0)
    if (index === questions.length - 1) {
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
    setQuestions([])
    setFinished(false)
    setTimeLeft(60)
  }

  if (!active) {
    return (
      <div className="tech-challenge tech-challenge--intro">
        <div className="tech-challenge__intro-grid" aria-hidden="true" />
        <div className="tech-challenge__intro-glow tech-challenge__intro-glow--one" aria-hidden="true" />
        <div className="tech-challenge__intro-glow tech-challenge__intro-glow--two" aria-hidden="true" />
        <div className="tech-challenge__intro-main">
          <div className="tech-challenge__badge"><Sparkles size={14} /> Tech IQ Challenge</div>
          <div className="tech-challenge__intro-copy">
            <p className="eyebrow">Your next tech step starts here</p>
            <h2 className="h-display">Can you beat the tech challenge?</h2>
            <p className="lede">Five quick questions. One minute. A simple way to test your technology instincts and discover where your learning journey could go next.</p>
          </div>
          <div className="tech-challenge__meta" aria-label="Challenge details">
            <span><strong>05</strong> questions</span>
            <span><strong>60s</strong> time limit</span>
            <span><strong>4</strong> result levels</span>
          </div>
        </div>
        <div className="tech-challenge__intro-side">
          <div className="tech-challenge__intro-window">
            <div className="tech-challenge__window-bar"><i /><i /><i /><span>tech-iq / ready</span></div>
            <div className="tech-challenge__window-body">
              <div className="tech-challenge__signal"><span /><span /><span /><span /></div>
              <div>
                <small>CHALLENGE STATUS</small>
                <strong>Ready when you are.</strong>
              </div>
              <div className="tech-challenge__window-score"><span>Questions</span><strong>05</strong></div>
            </div>
          </div>
          <div className="tech-challenge__intro-actions">
            <button type="button" className="btn btn-primary" onClick={start}>Start the challenge <ArrowRight size={15} /></button>
            <Link href="/tech-zone" className="btn btn-secondary">Explore Tech Zone</Link>
            <p>Play first. Your result comes at the end.</p>
          </div>
        </div>
        <div className="tech-challenge__journey" aria-label="Challenge journey">
          {journeySteps.map((step, stepIndex) => {
            const Icon = step.icon
            return (
              <div className="tech-challenge__journey-item" key={step.number}>
                <article className={`tech-challenge__journey-stage tech-challenge__journey-stage--${step.tone}`}>
                  <div className="tech-challenge__journey-heading">
                    <div className="tech-challenge__journey-icon"><Icon size={18} strokeWidth={2} /></div>
                    <div><span>{step.number}</span><h3>{step.title}</h3></div>
                  </div>
                  <p>{step.copy}</p>
                </article>
                {stepIndex < journeySteps.length - 1 && <div className="tech-challenge__journey-connector" aria-hidden="true"><span /><span /><ArrowRight size={16} /></div>}
              </div>
            )
          })}
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
        <div className="tech-challenge__result-path" aria-hidden="true">
          <span className="is-complete">01</span><i /><span className="is-complete">02</span><i /><span className="is-active">03</span>
        </div>
        <div className="tech-challenge__result-top">
          <div className="program-finder__result-icon" aria-hidden="true"><Trophy size={22} /></div>
          <div><p className="eyebrow">Challenge complete</p><span className="tech-challenge__result-label">You made it to the final stage</span></div>
        </div>
        <div className="tech-challenge__score-wrap">
          <div className="tech-challenge__score-ring" style={{ '--score': `${percentage}%` } as CSSProperties}>
            <strong>{percentage}%</strong>
            <span>{score}/5 correct</span>
          </div>
          <div>
            <p className="tech-challenge__level">{level}</p>
            <h2 className="h-section mt-1">Your Tech IQ is in.</h2>
            <p className="mt-2" style={{ color: 'var(--color-body)' }}>{message}</p>
          </div>
        </div>
        <div className="tech-challenge__result-journey">
          <div className="tech-challenge__result-journey-line" aria-hidden="true" />
          <div className="tech-challenge__result-step is-complete"><span>01</span><strong>Ready</strong><small>Challenge started</small></div>
          <div className="tech-challenge__result-step is-complete"><span>02</span><strong>Think</strong><small>{score}/5 answered correctly</small></div>
          <div className="tech-challenge__result-step is-current"><span>03</span><strong>Next</strong><small>Turn your result into a learning step</small></div>
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

  const current = questions[index]
  if (!current) return null
  const progress = ((index + 1) / questions.length) * 100
  return (
    <div className="tech-challenge tech-challenge--game">
      <div className="tech-challenge__game-path" aria-label={`Challenge stage 2 of 3. Question ${index + 1} of ${questions.length}`}>
        <span className="is-complete">01 <small>Ready</small></span>
        <i />
        <span className="is-active">02 <small>Think</small></span>
        <i />
        <span>03 <small>Discover</small></span>
      </div>
      <div className="tech-challenge__gamebar">
        <div>
          <p className="eyebrow">Tech IQ · Think stage</p>
          <p className="tech-challenge__question-count">Question {index + 1} <span>of {questions.length}</span></p>
        </div>
        <div className={`tech-challenge__timer${timeLeft <= 10 ? ' is-low' : ''}`} aria-label={`${timeLeft} seconds remaining`}><Timer size={15} /> {timeLeft}s</div>
      </div>
      <div className="tech-challenge__progress" aria-label={`Question ${index + 1} of ${questions.length}`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="tech-challenge__question-card">
        <span className="tech-challenge__question-number">0{index + 1}</span>
        <div className="tech-challenge__question-kicker"><span>THINK</span><small>Choose the best answer</small></div>
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
      <p className="tech-challenge__game-foot">One choice moves you forward. Trust your first good answer.</p>
    </div>
  )
}
