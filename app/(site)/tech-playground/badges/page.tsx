import Link from 'next/link'
import { buildMetadata } from '../../../../lib/seo'
import PageShell from '../../../../components/tech-playground/PageShell'
import BadgeShelf from '../../../../components/tech-playground/BadgeShelf'

const path = '/tech-playground/badges'
const description = 'See the digital badges you have earned in the APTECH Tech Playground.'
export const metadata = buildMetadata({ title: 'My Tech Badges | APTECH Abeokuta', description, path, noindex: true })

export default function Page() {
  return <PageShell path={path} name="My Badges" description={description}><div className="pg-stage pg-stage--light"><Link href="/tech-playground" className="pg-back">← Tech Playground</Link><p className="pg-eyebrow">Rewards</p><h1 className="pg-title">My Badges</h1><BadgeShelf /></div></PageShell>
}
