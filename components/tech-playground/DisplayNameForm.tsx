'use client'

import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'
import { setPlaygroundDisplayName } from '../../app/(site)/tech-playground/actions'
import { trackConversionEvent } from '../../lib/conversion-events'

export default function DisplayNameForm({ token, initial, onSaved }: { token: string; initial?: string | null; onSaved?: (name: string, newBadges: string[], rank: number | null) => void }) {
  const [name, setName] = useState(initial ?? '')
  const [msg, setMsg] = useState('')
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()
  return (
    <form className="pg-name" onSubmit={(e) => { e.preventDefault(); setMsg(''); start(async () => {
      const r = await setPlaygroundDisplayName({ token, name })
      if (!r.ok) { setMsg(r.message); return }
      setSaved(true); setName(r.displayName); trackConversionEvent('playground_leaderboard_name_set'); onSaved?.(r.displayName, r.newBadges as string[], r.rank)
    }) }}>
      <label htmlFor="pg-display-name" className="field-label">Public display name</label>
      <div className="pg-name__row">
        <input id="pg-display-name" className="field-input" value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }} maxLength={20} minLength={3} placeholder="e.g. CodeMaster" autoComplete="nickname" aria-describedby="pg-name-help" />
        <button className="btn btn-primary" disabled={pending || name.trim().length < 3}>{pending ? 'Saving…' : saved ? 'Saved' : 'Join the Arena'} {saved && <Check size={15} />}</button>
      </div>
      <p id="pg-name-help" className="pg-muted">Shown on the public leaderboard. Pick a nickname, not your real name, email or phone number.</p>
      {msg && <p role="alert" className="pg-error">{msg}</p>}
      {saved && <p role="status" className="pg-ok">You&apos;re on the board. Your best scores now appear in the Tech Arena.</p>}
    </form>
  )
}
