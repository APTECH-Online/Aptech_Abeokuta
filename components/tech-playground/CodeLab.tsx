'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ChevronLeft, Code2, Lightbulb, Play, RotateCcw } from 'lucide-react'
import { CODE_TASKS, BADGES, type BadgeKey } from '../../data/playground'
import { submitPlaygroundActivity } from '../../app/(site)/tech-playground/actions'
import { captureAttribution, getAttributionSnapshot } from '../../lib/attribution'
import { trackConversionEvent } from '../../lib/conversion-events'
import ShareButton from './ShareButton'
import { usePlayground } from './usePlayground'

// The learner's HTML is rendered inside a sandboxed iframe with NO script or
// same-origin permissions, so nothing they type can run code on our site.
const SANDBOX_STYLE = '<style>body{font-family:system-ui,sans-serif;padding:16px;color:#1B1626}.demo-btn{background:#112161;color:#fff;border:0;border-radius:10px;padding:12px 20px;font-size:16px;font-weight:600}</style>'

export default function CodeLab() {
  const pg = usePlayground()
  const [taskIndex, setTaskIndex] = useState(0)
  const task = CODE_TASKS[taskIndex]
  const [code, setCode] = useState(task.starter)
  const [passed, setPassed] = useState<Record<string, boolean>>({})
  const [showHint, setShowHint] = useState(false)
  const [tried, setTried] = useState(false)
  const [badges, setBadges] = useState<string[]>([])
  const allDone = CODE_TASKS.every((t) => passed[t.id])

  useEffect(() => { captureAttribution(window.location.search); trackConversionEvent('playground_activity_started', { kind: 'code_lab' }) }, [])
  useEffect(() => { setCode(task.starter); setShowHint(false); setTried(false) }, [task])

  const ok = useMemo(() => {
    const hay = task.check.ignoreCase ? code.toLowerCase() : code
    const needle = task.check.ignoreCase ? task.check.value.toLowerCase() : task.check.value
    return hay.includes(needle) && code !== task.starter
  }, [code, task])

  async function run() {
    setTried(true)
    if (!ok || passed[task.id]) return
    setPassed((p) => ({ ...p, [task.id]: true }))
    const r = await submitPlaygroundActivity({ token: pg.token, kind: 'code_lab', codeTaskId: task.id, attribution: getAttributionSnapshot() })
    if (r.ok && r.newBadges.length) setBadges((b) => [...new Set([...b, ...(r.newBadges as string[])])])
    pg.refresh()
  }

  const srcDoc = `<!doctype html><meta charset="utf-8">${SANDBOX_STYLE}${code}`
  return (
    <div className="pf cl">
      <div className="pf__glow" aria-hidden="true" />
      <div className="pf__dots" aria-hidden="true" />
      <div className="pf__inner">
        <Link href="/tech-playground" className="pgx-back"><ChevronLeft size={15} aria-hidden="true" /> Tech Playground</Link>
        <p className="pgx-badge"><Code2 size={13} aria-hidden="true" /> Code Lab</p>
        <div className="pf__meta cl__steps">
          <p className="pf__step-label"><span>Task</span> {String(taskIndex + 1).padStart(2, '0')} <span>of</span> {String(CODE_TASKS.length).padStart(2, '0')}</p>
          <div className="pf__progress" role="progressbar" aria-label="Code Lab progress" aria-valuemin={0} aria-valuemax={CODE_TASKS.length} aria-valuenow={Object.keys(passed).length}>
            {CODE_TASKS.map((t, i) => <span key={t.id} className={passed[t.id] ? 'is-done' : i === taskIndex ? 'is-current' : ''} />)}
          </div>
        </div>
        <h1 className="pf__question pf__question--hero">{task.title}</h1>
        <p className="mt-3 leading-relaxed max-w-2xl" style={{ color: 'var(--color-body)' }}>{task.brief}</p>
        <div className="cl__grid">
          <div className="cl-win cl-win--dark">
            <div className="cl-win__bar"><span className="cl-win__dots" aria-hidden="true"><i /><i /><i /></span><label htmlFor="pg-code" className="cl-win__title">Your code · index.html</label></div>
            <textarea id="pg-code" className="pg-editor cl-editor" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} autoCapitalize="off" autoCorrect="off" rows={7} />
          </div>
          <div className="cl-win">
            <div className="cl-win__bar"><span className="cl-win__dots" aria-hidden="true"><i /><i /><i /></span><span className="cl-win__title">Live preview</span></div>
            <iframe title="Live preview of your code" className="pg-preview cl-preview" sandbox="" srcDoc={srcDoc} />
          </div>
        </div>
        <div className="cl__actions">
          <button className="btn btn-accent" onClick={run}><Play size={15} aria-hidden="true" /> Run my code</button>
          <button className="btn btn-secondary" onClick={() => { setCode(task.starter); setTried(false) }}><RotateCcw size={15} aria-hidden="true" /> Reset</button>
          <button className="btn btn-secondary" onClick={() => setShowHint((v) => !v)} aria-expanded={showHint}><Lightbulb size={15} aria-hidden="true" /> Hint</button>
        </div>
        {showHint && <p className="cl-hint"><Lightbulb size={16} aria-hidden="true" /> <span>{task.hint}</span></p>}
        {tried && !ok && !passed[task.id] && <p className="pg-error" role="alert">Not quite yet. Check your change and run it again.</p>}
      {passed[task.id] && (
        <div className="pg-panel pg-panel--ok" role="status">
          <strong><Check size={16} className="inline" /> Task complete!</strong>
          {!allDone && <div className="pg-actions pg-actions--tight"><button className="btn btn-accent" onClick={() => setTaskIndex((i) => Math.min(CODE_TASKS.length - 1, i + 1))} disabled={taskIndex === CODE_TASKS.length - 1}>Next task <ArrowRight size={15} /></button></div>}
        </div>
      )}
      {badges.length > 0 && <div className="pg-panel pg-panel--gold" role="status"><h3 className="pg-h3">Badge earned!</h3><ul className="pg-badges-inline">{badges.map((b) => <li key={b}><span aria-hidden="true">{BADGES[b as BadgeKey]?.emoji}</span> {BADGES[b as BadgeKey]?.title}</li>)}</ul></div>}
      {(Object.keys(passed).length > 0) && (
        <div className="pg-panel pg-panel--hero">
          <h2 className="pg-h2">🎉 You just wrote your first piece of code.</h2>
          <p>Imagine what you could build with proper training.</p>
          <div className="pg-actions"><Link href="/courses" className="btn btn-accent" onClick={() => trackConversionEvent('playground_cta_clicked', { kind: 'code_lab' })}>Start Learning <ArrowRight size={15} /></Link>
            <ShareButton text="I just wrote my first lines of code in the APTECH Tech Playground!" path="/tech-playground/code-lab" label="Share" /></div>
        </div>
      )}
      </div>
    </div>
  )
}
