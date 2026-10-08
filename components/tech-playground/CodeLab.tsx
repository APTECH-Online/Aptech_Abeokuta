'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Lightbulb, RotateCcw } from 'lucide-react'
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
    <div className="pg-stage pg-stage--light pg-lab">
      <Link href="/tech-playground" className="pg-back">← Tech Playground</Link>
      <p className="pg-eyebrow">Code Lab · Task {taskIndex + 1} of {CODE_TASKS.length}</p>
      <h1 className="pg-title">{task.title}</h1>
      <p className="pg-lede">{task.brief}</p>
      <div className="pg-lab__grid">
        <div>
          <label htmlFor="pg-code" className="field-label">Your code</label>
          <textarea id="pg-code" className="pg-editor" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} autoCapitalize="off" autoCorrect="off" rows={6} />
          <div className="pg-actions pg-actions--tight">
            <button className="btn btn-primary" onClick={run}>Run my code</button>
            <button className="btn btn-secondary" onClick={() => { setCode(task.starter); setTried(false) }}><RotateCcw size={15} /> Reset</button>
            <button className="btn btn-secondary" onClick={() => setShowHint((v) => !v)}><Lightbulb size={15} /> Hint</button>
          </div>
          {showHint && <p className="pg-note">{task.hint}</p>}
          {tried && !ok && !passed[task.id] && <p className="pg-error" role="alert">Not quite yet. Check your change and run it again.</p>}
        </div>
        <div>
          <p className="field-label">Live preview</p>
          <iframe title="Live preview of your code" className="pg-preview" sandbox="" srcDoc={srcDoc} />
        </div>
      </div>
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
  )
}
