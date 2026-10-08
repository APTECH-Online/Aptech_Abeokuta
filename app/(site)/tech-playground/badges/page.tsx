import Link from 'next/link'
import { Award, ChevronLeft } from 'lucide-react'
import { buildMetadata } from '../../../../lib/seo'
import PageShell from '../../../../components/tech-playground/PageShell'
import BadgeShelf from '../../../../components/tech-playground/BadgeShelf'

const path = '/tech-playground/badges'
const description = 'See the digital badges you have earned in the APTECH Tech Playground.'
export const metadata = buildMetadata({ title: 'My Tech Badges | APTECH Abeokuta', description, path, noindex: true })

export default function Page() {
  return (
    <PageShell path={path} name="My Badges" description={description}>
      <div className="pf bd">
        <div className="pf__glow" aria-hidden="true" />
        <div className="pf__dots" aria-hidden="true" />
        <div className="pf__inner">
          <Link href="/tech-playground" className="pgx-back"><ChevronLeft size={15} aria-hidden="true" /> Tech Playground</Link>
          <p className="pgx-badge"><Award size={13} aria-hidden="true" /> Rewards</p>
          <h1 className="pf__question pf__question--hero">My Badges</h1>
          <BadgeShelf />
        </div>
      </div>
    </PageShell>
  )
}
