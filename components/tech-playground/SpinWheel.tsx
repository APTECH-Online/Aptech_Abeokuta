'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SPIN_OUTCOMES, type SpinOutcome } from '../../data/playground'
import { trackConversionEvent } from '../../lib/conversion-events'

const N = SPIN_OUTCOMES.length
const SEG = 360 / N

function arc(i: number, r = 150, cx = 160, cy = 160) {
  const a0 = ((i * SEG - 90) * Math.PI) / 180, a1 = (((i + 1) * SEG - 90) * Math.PI) / 180
  return `M${cx} ${cy} L${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}Z`
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

  return (
    <div className="pg-stage pg-stage--light pg-spin">
      <Link href="/tech-playground" className="pg-back">← Tech Playground</Link>
      <p className="pg-eyebrow">Just for fun · no prizes, no stakes</p>
      <h1 className="pg-title">Spin to Learn</h1>
      <p className="pg-lede">Spin the wheel for a tech tip, a career fact, a mini challenge or a learning idea.</p>
      <div className="pg-wheel-wrap">
        <div className="pg-wheel-pointer" aria-hidden="true" />
        <svg viewBox="0 0 320 320" className="pg-wheel" style={{ transform: `rotate(${rotation}deg)`, transition: spinning && !reduced.current ? 'transform 3.5s cubic-bezier(.15,.7,.1,1)' : 'none' }} role="img" aria-label={`Wheel with ${N} learning outcomes`}>
          {SPIN_OUTCOMES.map((o, i) => (
            <g key={o.id}>
              <path d={arc(i)} fill={o.color} stroke="#fff" strokeWidth="2" />
              <text x="160" y="42" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle" transform={`rotate(${i * SEG + SEG / 2} 160 160)`}>{o.label}</text>
            </g>
          ))}
          <circle cx="160" cy="160" r="24" fill="#fff" stroke="#E8E0D0" strokeWidth="2" />
        </svg>
      </div>
      <button className="btn btn-accent pg-start" onClick={spin} disabled={spinning}>{spinning ? 'Spinning…' : spins ? 'Spin again' : 'Spin the wheel'}</button>
      <div aria-live="polite" className="pg-spin__result">
        {outcome && (
          <div className="pg-panel pg-panel--hero">
            <p className="pg-eyebrow">{outcome.title}</p>
            <p className="pg-spin__body">{outcome.body}</p>
            {outcome.href && <Link href={outcome.href} className="btn btn-primary mt-3" onClick={() => trackConversionEvent('playground_cta_clicked', { kind: 'spin', outcome: outcome.kind })}>{outcome.cta} <ArrowRight size={15} /></Link>}
          </div>
        )}
      </div>
    </div>
  )
}
