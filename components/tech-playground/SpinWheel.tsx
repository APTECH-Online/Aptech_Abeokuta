'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, BriefcaseBusiness, ChevronLeft, GraduationCap, Lightbulb, RotateCcw, Search, Sparkles, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SPIN_OUTCOMES, type SpinOutcome } from '../../data/playground'
import { trackConversionEvent } from '../../lib/conversion-events'

const N = SPIN_OUTCOMES.length
const SEG = 360 / N
const CX = 160
const CY = 160
const R = 138
const BULBS = 24

const KIND_ICON: Record<SpinOutcome['kind'], LucideIcon> = {
  tip: Lightbulb, mini: Zap, fact: BriefcaseBusiness, programme: GraduationCap, bonus: Search, resource: BookOpen, again: RotateCcw
}

const pt = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const
}

function arc(i: number) {
  const [x0, y0] = pt(i * SEG, R)
  const [x1, y1] = pt((i + 1) * SEG, R)
  return `M${CX} ${CY} L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1}Z`
}

/** Purely educational: no stakes, no prizes, no money. */
export default function SpinWheel() {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [outcome, setOutcome] = useState<SpinOutcome | null>(null)
  const [spins, setSpins] = useState(0)
  const reduced = useRef(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  function spin() {
    if (spinning) return
    setOutcome(null); setSpinning(true)
    const pick = Math.floor(Math.random() * N)
    // Land the pointer (top, 0°) in the middle of the chosen segment.
    const target = 360 * 5 + (360 - (pick * SEG + SEG / 2))
    const next = rotation - (rotation % 360) + target
    setRotation(next)
    window.setTimeout(() => { setSpinning(false); setOutcome(SPIN_OUTCOMES[pick]); setSpins((s) => s + 1); trackConversionEvent('playground_activity_completed', { kind: 'spin', outcome: SPIN_OUTCOMES[pick].kind }) }, reduced.current ? 50 : 3600)
  }

  const Icon = outcome ? KIND_ICON[outcome.kind] : Sparkles

  return (
    <div className="pf sp">
      <div className="pf__glow" aria-hidden="true" />
      <div className="pf__dots" aria-hidden="true" />
      <div className="pf__inner sp__grid">
        <div className="sp__copy">
          <Link href="/tech-playground" className="lb__back"><ChevronLeft size={15} aria-hidden="true" /> Tech Playground</Link>
          <p className="lb__badge"><Sparkles size={13} aria-hidden="true" /> Just for fun · no prizes, no stakes</p>
          <h1 className="pg-title">Spin to Learn</h1>
          <p className="pg-lede">Spin the wheel for a tech tip, a career fact, a mini challenge or a learning idea.</p>

          <div className="sp__actions">
            <button className="btn btn-accent pg-start sp__btn" onClick={spin} disabled={spinning}>
              <RotateCcw size={16} className={spinning ? 'sp__spin-icon' : ''} aria-hidden="true" /> {spinning ? 'Spinning…' : spins ? 'Spin again' : 'Spin the wheel'}
            </button>
            {spins > 0 && <p className="sp__count"><b>{spins}</b> {spins === 1 ? 'spin' : 'spins'} this visit</p>}
          </div>

          <div aria-live="polite" className="sp__result">
            {outcome ? (
              <div className="sp-card" key={spins} style={{ ['--tone' as any]: outcome.color }}>
                <div className="sp-card__top">
                  <span className="sp-card__icon" aria-hidden="true"><Icon size={20} strokeWidth={2} /></span>
                  <span className="sp-card__tag">{outcome.title}</span>
                </div>
                <p className="sp-card__body">{outcome.body}</p>
                {outcome.href && <Link href={outcome.href} className="btn btn-primary sp-card__cta" onClick={() => trackConversionEvent('playground_cta_clicked', { kind: 'spin', outcome: outcome.kind })}>{outcome.cta} <ArrowRight size={15} aria-hidden="true" /></Link>}
              </div>
            ) : (
              <div className="sp-card sp-card--idle">
                <span className="sp-card__icon" aria-hidden="true"><Sparkles size={20} /></span>
                <p className="sp-card__body">{spinning ? 'Round and round it goes…' : 'Your result lands here. Give the wheel a spin.'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="sp__stage">
          <div className={`sp-wheel${spinning ? ' is-spinning' : ''}`}>
            <div className="sp-wheel__pointer" aria-hidden="true"><i /></div>
            <svg viewBox="0 0 320 320" className="sp-wheel__svg" style={{ transform: `rotate(${rotation}deg)`, transition: spinning && !reduced.current ? 'transform 3.5s cubic-bezier(.15,.7,.1,1)' : 'none' }} role="img" aria-label={`Wheel with ${N} learning outcomes`}>
              <defs>
                <radialGradient id="sp-shade" cx="50%" cy="50%" r="50%">
                  <stop offset="25%" stopColor="#fff" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000" stopOpacity=".22" />
                </radialGradient>
                <linearGradient id="sp-rim" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1F328B" /><stop offset="100%" stopColor="#0B1747" />
                </linearGradient>
              </defs>
              <circle cx={CX} cy={CY} r="158" fill="url(#sp-rim)" />
              {Array.from({ length: BULBS }, (_, i) => {
                const [x, y] = pt((i * 360) / BULBS, 149)
                return <circle key={i} cx={x} cy={y} r="3" className={`sp-bulb${i % 2 ? ' is-alt' : ''}`} />
              })}
              {SPIN_OUTCOMES.map((o, i) => {
                const mid = i * SEG + SEG / 2
                return (
                  <g key={o.id}>
                    <path d={arc(i)} fill={o.color} stroke="rgba(255,255,255,.85)" strokeWidth="1.5" />
                    <path d={arc(i)} fill="url(#sp-shade)" />
                    <text x={CX + R - 10} y={CY} fill="#fff" fontSize="10.5" fontWeight="700" textAnchor="end" dominantBaseline="central" transform={`rotate(${mid - 90} ${CX} ${CY})`} style={{ letterSpacing: '.02em' }}>{o.label}</text>
                  </g>
                )
              })}
              <circle cx={CX} cy={CY} r="34" fill="rgba(11,23,71,.18)" />
            </svg>
            <button type="button" className="sp-wheel__hub" onClick={spin} disabled={spinning} aria-label={spinning ? 'Spinning' : 'Spin the wheel'}>
              <span>{spinning ? '…' : 'SPIN'}</span>
            </button>
          </div>
          <p className="sp__hint"><Sparkles size={13} aria-hidden="true" /> Tap the centre or the button to spin</p>
        </div>
      </div>
    </div>
  )
}
