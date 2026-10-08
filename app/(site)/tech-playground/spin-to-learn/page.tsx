import { buildMetadata } from '../../../../lib/seo'
import PageShell from '../../../../components/tech-playground/PageShell'
import SpinWheel from '../../../../components/tech-playground/SpinWheel'

const path = '/tech-playground/spin-to-learn'
const description = 'Spin the wheel for a tech tip, career fact, mini challenge or learning resource. Just for fun, with no prizes or stakes.'
export const metadata = buildMetadata({ title: 'Spin to Learn | APTECH Abeokuta Tech Playground', description, path })

export default function Page() {
  return <PageShell path={path} name="Spin to Learn" description={description}><SpinWheel /></PageShell>
}
