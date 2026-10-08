import Link from 'next/link'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { requireChallengeAccess } from '../../../../../lib/tech-zone'
import { setAttemptHidden, setParticipantHidden } from '../actions'

async function attemptAction(fd: FormData): Promise<void> { 'use server'; await setAttemptHidden(fd) }
async function participantAction(fd: FormData): Promise<void> { 'use server'; await setParticipantHidden(fd) }

export default async function LeaderboardModeration() {
  await requireChallengeAccess('view')
  const admin = createAdminClient()
  const { data } = await admin.from('tech_challenge_attempts')
    .select('id,participant_id,percentage,completion_time_seconds,completed_at,is_hidden,tech_challenges(name),playground_participants(id,display_name,is_hidden)')
    .eq('completion_status', 'completed').not('participant_id', 'is', null).order('completed_at', { ascending: false }).limit(100)
  const rows = (data ?? []) as any[]
  return (
    <div className="tech-zone-admin-page grid gap-6 min-w-0">
      <div><p className="eyebrow">Tech Playground</p><h1 className="h-section mt-1">Leaderboard moderation</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>Latest 100 completed attempts. Hide an offensive display name or a suspicious score. Hidden players and scores disappear from the public Tech Arena immediately. <Link href="/admin/challenges" className="underline">Back to challenges</Link></p></div>
      <section className="card overflow-hidden min-w-0"><div className="overflow-x-auto">
        <table className="admin-table is-stackable w-full text-sm">
          <thead><tr><th>Display name</th><th>Challenge</th><th>Score</th><th>Time</th><th>State</th><th>Actions</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}>
              <td data-primary data-label="Display name"><strong>{r.playground_participants?.display_name || <em>(no name)</em>}</strong></td>
              <td data-label="Challenge">{r.tech_challenges?.name}</td>
              <td data-label="Score">{Math.round(Number(r.percentage))}%</td>
              <td data-label="Time">{r.completion_time_seconds}s</td>
              <td data-label="State">{r.playground_participants?.is_hidden ? 'Player hidden' : r.is_hidden ? 'Score hidden' : 'Visible'}</td>
              <td data-label="Actions"><div className="flex flex-wrap gap-2">
                <form action={attemptAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="hidden" value={String(!r.is_hidden)} /><button className="btn btn-ghost btn-sm">{r.is_hidden ? 'Show score' : 'Hide score'}</button></form>
                <form action={participantAction}><input type="hidden" name="id" value={r.participant_id} /><input type="hidden" name="hidden" value={String(!r.playground_participants?.is_hidden)} /><button className="btn btn-ghost btn-sm">{r.playground_participants?.is_hidden ? 'Show player' : 'Hide player'}</button></form>
              </div></td>
            </tr>))}
          </tbody>
        </table></div></section>
    </div>
  )
}
