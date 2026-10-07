import Link from 'next/link'
import { deleteQuestion, saveChallenge, saveQuestion } from '../actions'
import { getAdminChallenge } from '../../../../../lib/tech-zone'

async function saveChallengeAction(fd: FormData): Promise<void> {
  'use server'
  await saveChallenge(fd)
}

async function saveQuestionAction(fd: FormData): Promise<void> {
  'use server'
  await saveQuestion(fd)
}

async function deleteQuestionAction(fd: FormData): Promise<void> {
  'use server'
  await deleteQuestion(fd)
}

export default async function ChallengeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { challenge, questions } = await getAdminChallenge(id)

  if (!challenge) return <p>Challenge not found.</p>

  return (
    <div className="tech-zone-admin-page tech-zone-challenge-detail grid gap-6 min-w-0">
      <header className="tech-zone-detail-header">
        <div className="min-w-0">
          <p className="eyebrow">Tech Zone / Challenge</p>
          <div className="tech-zone-detail-title-row">
            <div className="min-w-0">
              <h1 className="h-section mt-1 break-words">{challenge.name}</h1>
              <p className="text-sm mt-2 tech-zone-detail-description">
                Manage challenge settings, questions and the question bank. Correct answers remain server-side.
              </p>
            </div>
            <div className="tech-zone-detail-meta" aria-label="Challenge information">
              <span className="status-pill">{challenge.status}</span>
              <span className="tech-zone-meta-text">{challenge.difficulty}</span>
              <span className="tech-zone-meta-text">{challenge.challenge_type}</span>
            </div>
          </div>
        </div>
      </header>

      <form action={saveChallengeAction} className="card p-5 sm:p-6 grid gap-4 min-w-0">
        <div className="tech-zone-section-heading">
          <div>
            <p className="eyebrow">Challenge settings</p>
            <h2 className="h-section">Digital Skills Speed Test</h2>
          </div>
          <span className="tech-zone-section-note">Core challenge configuration</span>
        </div>
        <input type="hidden" name="id" value={id} />

        <div className="tz-field-grid tz-field-grid--2">
          <label className="tz-field">Name<input name="name" defaultValue={challenge.name} className="input mt-1" /></label>
          <label className="tz-field">Slug<input name="slug" defaultValue={challenge.slug} className="input mt-1" /></label>
          <label className="tz-field">Category<input name="category" defaultValue={challenge.category} className="input mt-1" /></label>
          <label className="tz-field">Status<select name="status" defaultValue={challenge.status} className="input mt-1"><option>draft</option><option>active</option><option>archived</option></select></label>
          <label className="tz-field">Difficulty<select name="difficulty" defaultValue={challenge.difficulty} className="input mt-1"><option>beginner</option><option>intermediate</option><option>advanced</option></select></label>
          <label className="tz-field">Type<select name="challenge_type" defaultValue={challenge.challenge_type} className="input mt-1"><option>quiz</option><option>debug</option><option>logic</option><option>sql</option><option>weekly</option></select></label>
          <label className="tz-field">Estimated minutes<input name="estimated_minutes" type="number" defaultValue={challenge.estimated_minutes} className="input mt-1" /></label>
          <label className="tz-field">Sort order<input name="sort_order" type="number" defaultValue={challenge.sort_order} className="input mt-1" /></label>
        </div>

        <label className="tz-field">Description<textarea name="description" defaultValue={challenge.description} className="input mt-1" rows={4} /></label>
        <label className="tz-field">Recommendation rules (JSON)<textarea name="recommendation_rules" defaultValue={JSON.stringify(challenge.recommendation_rules || [], null, 2)} className="input mt-1 font-mono text-xs" rows={6} /><span className="text-xs tech-zone-help-text">Use skillArea + programmeCodes, e.g. [{`{`}"skillArea":"Programming","programmeCodes":["ADSE"]{`}`}].</span></label>

        <div className="flex flex-wrap gap-5 min-w-0 tech-zone-checkboxes">
          <label className="tz-check"><input type="checkbox" name="is_featured" defaultChecked={challenge.is_featured} /> Featured challenge</label>
          <label className="tz-check"><input type="checkbox" name="is_weekly" defaultChecked={challenge.is_weekly} /> Weekly challenge</label>
        </div>

        <input type="hidden" name="scoring_config" value={JSON.stringify(challenge.scoring_config || {})} />
        <div className="flex flex-wrap gap-3 tech-zone-admin-actions">
          <button className="btn btn-primary">Save challenge</button>
          <Link href={`/tech-zone/${challenge.slug}`} className="btn btn-secondary">View public</Link>
        </div>
      </form>

      <section className="card p-5 sm:p-6 min-w-0">
        <div className="tech-zone-section-heading">
          <div>
            <p className="eyebrow">Question management</p>
            <h2 className="h-section">Add Question</h2>
          </div>
          <span className="tech-zone-section-note">Build the test question by question</span>
        </div>

        <form action={saveQuestionAction} className="grid gap-4 mt-5 min-w-0">
          <input type="hidden" name="challenge_id" value={id} />
          <label className="tz-field">Question<textarea name="question" required className="input mt-1" rows={4} /></label>
          <label className="tz-field">Options (JSON)<textarea name="options" required className="input mt-1 font-mono text-xs" rows={5} placeholder='["Option A","Option B","Option C"]' /><span className="text-xs tech-zone-help-text">One entry per answer option. "Correct index" below is zero-based (0 = first option).</span></label>

          <div className="tz-field-grid tz-field-grid--4">
            <label className="tz-field">Correct index<input name="correct_answer" type="number" min="0" defaultValue="0" className="input mt-1" /></label>
            <label className="tz-field">Points<input name="points" type="number" defaultValue="10" className="input mt-1" /></label>
            <label className="tz-field">Skill area<input name="skill_area" defaultValue="Technology Fundamentals" className="input mt-1" /></label>
            <label className="tz-field">Order<input name="sort_order" type="number" defaultValue={questions.length + 1} className="input mt-1" /></label>
          </div>

          <label className="tz-field">Explanation<textarea name="explanation" className="input mt-1" rows={3} /></label>
          <input type="hidden" name="difficulty" value={challenge.difficulty} />
          <div className="tech-zone-form-actions">
            <button className="btn btn-primary btn-sm">Add question</button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 min-w-0 tech-zone-question-bank">
        <div className="tech-zone-question-bank-heading">
          <div className="min-w-0">
            <p className="eyebrow">Content library</p>
            <h2 className="h-section">Question Bank</h2>
            <p className="text-sm mt-1 tech-zone-detail-description">Review and maintain all questions included in this challenge.</p>
          </div>
          <span className="tech-zone-question-count">{questions.length} {questions.length === 1 ? 'question' : 'questions'}</span>
        </div>

        {questions.length === 0 ? (
          <div className="card tech-zone-empty-state">
            <strong>No questions yet</strong>
            <span>Add the first question above to start building the challenge.</span>
          </div>
        ) : questions.map((q: any, index: number) => (
          <details key={q.id} className="card tech-zone-question-item min-w-0">
            <summary className="tech-zone-question-summary">
              <span className="tech-zone-question-number">{q.sort_order || index + 1}</span>
              <span className="tech-zone-question-summary-text">{q.question}</span>
              <span className="tech-zone-question-chevron" aria-hidden="true">+</span>
            </summary>

            <div className="tech-zone-question-editor">
              <form action={saveQuestionAction} className="grid gap-4 min-w-0">
                <input type="hidden" name="id" value={q.id} />
                <input type="hidden" name="challenge_id" value={id} />
                <label className="tz-field">Question<textarea name="question" defaultValue={q.question} className="input mt-1" rows={4} /></label>
                <label className="tz-field">Options (JSON)<textarea name="options" defaultValue={JSON.stringify(q.options)} className="input mt-1 font-mono text-xs" rows={4} /></label>

                <div className="tz-field-grid tz-field-grid--4">
                  <label className="tz-field">Correct index<input name="correct_answer" type="number" defaultValue={q.correct_answer} className="input mt-1" /></label>
                  <label className="tz-field">Points<input name="points" type="number" defaultValue={q.points} className="input mt-1" /></label>
                  <label className="tz-field">Skill area<input name="skill_area" defaultValue={q.skill_area} className="input mt-1" /></label>
                  <label className="tz-field">Order<input name="sort_order" type="number" defaultValue={q.sort_order} className="input mt-1" /></label>
                </div>

                <label className="tz-field">Explanation<textarea name="explanation" defaultValue={q.explanation || ''} className="input mt-1" rows={3} /></label>
                <input type="hidden" name="difficulty" value={q.difficulty} />
                <div className="tech-zone-form-actions">
                  <button className="btn btn-primary btn-sm">Save question</button>
                </div>
              </form>

              <form action={deleteQuestionAction} className="tech-zone-delete-form">
                <input type="hidden" name="id" value={q.id} />
                <input type="hidden" name="challenge_id" value={id} />
                <button className="btn btn-ghost btn-sm" type="submit">Delete question</button>
              </form>
            </div>
          </details>
        ))}
      </section>
    </div>
  )
}
