import Link from 'next/link'
import { ArrowRight, Bug, Database, Globe, ShieldAlert, BarChart3 } from 'lucide-react'
import { buildMetadata } from '../../../../lib/seo'
import { getPlaygroundChallenges } from '../../../../lib/playground'
import PageShell from '../../../../components/tech-playground/PageShell'
import { DETECTIVE_CASES } from '../../../../data/playground'

const path = '/tech-playground/tech-detective'
const description = 'Investigate technology problems: find the bug in code, diagnose a broken web page, fix a SQL query or spot a cyber threat.'
export const metadata = buildMetadata({ title: 'Tech Detective: Find the Bug | APTECH Abeokuta', description, path })
export const dynamic = 'force-dynamic'
const icons = { code: Bug, web: Globe, sql: Database, cyber: ShieldAlert, data: BarChart3 }

export default async function Page() {
  const cases = await getPlaygroundChallenges('detective')
  const available = new Set(cases.map((c) => c.detective_category))
  return (
    <PageShell path={path} name="Tech Detective" description={description} narrow={false}>
      <div className="pg-stage pg-stage--light">
        <Link href="/tech-playground" className="pg-back">← Tech Playground</Link>
        <p className="pg-eyebrow">Case files</p>
        <h1 className="pg-title">Tech Detective</h1>
        <p className="pg-lede">Something is broken. You have the clues and the clock. Choose a case file.</p>
        <ul className="pg-cards">
          {DETECTIVE_CASES.map((c) => {
            const Icon = icons[c.category]; const href = c.category === 'data' ? '/tech-playground/data-detective' : `/tech-playground/tech-detective/${c.category}`
            const ok = c.category === 'data' || available.has(c.category)
            return <li key={c.category}>{ok ? <Link href={href} className="pg-card"><span className="pg-card__icon"><Icon size={22} /></span><strong>{c.title}</strong><span>{c.text}</span><em>Open case <ArrowRight size={14} /></em></Link> : <div className="pg-card is-soon"><span className="pg-card__icon"><Icon size={22} /></span><strong>{c.title}</strong><span>Coming soon</span></div>}</li>
          })}
        </ul>
      </div>
    </PageShell>
  )
}
