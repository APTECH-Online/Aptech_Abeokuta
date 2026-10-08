import Link from 'next/link'
import { ArrowRight, BarChart3, Bug, ChevronLeft, Database, Globe, Lock, Search, ShieldAlert } from 'lucide-react'
import { buildMetadata } from '../../../../lib/seo'
import { getPlaygroundChallenges } from '../../../../lib/playground'
import PageShell from '../../../../components/tech-playground/PageShell'
import { DETECTIVE_CASES } from '../../../../data/playground'

const path = '/tech-playground/tech-detective'
const description = 'Investigate technology problems: find the bug in code, diagnose a broken web page, fix a SQL query or spot a cyber threat.'
export const metadata = buildMetadata({ title: 'Tech Detective: Find the Bug | APTECH Abeokuta', description, path })
export const dynamic = 'force-dynamic'
const icons = { code: Bug, web: Globe, sql: Database, cyber: ShieldAlert, data: BarChart3 }
const tones = { code: 'navy', web: 'teal', sql: 'amber', cyber: 'red', data: 'violet' } as const

export default async function Page() {
  const cases = await getPlaygroundChallenges('detective')
  const available = new Set(cases.map((c) => c.detective_category))
  const open = DETECTIVE_CASES.filter((c) => c.category === 'data' || available.has(c.category)).length
  return (
    <PageShell path={path} name="Tech Detective" description={description} narrow={false}>
      <div className="pf td">
        <div className="pf__glow" aria-hidden="true" />
        <div className="pf__dots" aria-hidden="true" />
        <div className="pf__inner">
          <Link href="/tech-playground" className="pgx-back"><ChevronLeft size={15} aria-hidden="true" /> Tech Playground</Link>
          <p className="pgx-badge"><Search size={13} aria-hidden="true" /> Case files</p>
          <h1 className="pf__question pf__question--hero">Tech Detective</h1>
          <p className="mt-3 leading-relaxed max-w-2xl" style={{ color: 'var(--color-body)' }}>Something is broken. You have the clues and the clock. Choose a case file.</p>
          <p className="td__count"><b>{open}</b> of {DETECTIVE_CASES.length} cases open</p>
          <ul className="td__grid">
            {DETECTIVE_CASES.map((c) => {
              const Icon = icons[c.category]
              const tone = tones[c.category]
              const href = c.category === 'data' ? '/tech-playground/data-detective' : `/tech-playground/tech-detective/${c.category}`
              const ok = c.category === 'data' || available.has(c.category)
              return (
                <li key={c.category}>
                  {ok ? (
                    <Link href={href} className={`td-card td-card--${tone}`}>
                      <span className="td-card__icon" aria-hidden="true"><Icon size={22} /></span>
                      <strong>{c.title}</strong>
                      <span className="td-card__text">{c.text}</span>
                      <span className="td-card__cta">Open case <ArrowRight size={15} aria-hidden="true" /></span>
                    </Link>
                  ) : (
                    <div className={`td-card td-card--${tone} is-soon`} aria-disabled="true">
                      <span className="td-card__icon" aria-hidden="true"><Icon size={22} /></span>
                      <strong>{c.title}</strong>
                      <span className="td-card__text">{c.text}</span>
                      <span className="td-card__cta"><Lock size={14} aria-hidden="true" /> Coming soon</span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </PageShell>
  )
}
