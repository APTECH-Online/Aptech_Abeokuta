import { buildMetadata } from '../../../../lib/seo'
import PageShell from '../../../../components/tech-playground/PageShell'
import CodeLab from '../../../../components/tech-playground/CodeLab'

const path = '/tech-playground/code-lab'
const description = 'Write your first lines of code in your browser. No sign-up, no installs. Change a button, a heading and a colour.'
export const metadata = buildMetadata({ title: 'Code Your First Thing | APTECH Abeokuta Code Lab', description, path })

export default function Page() {
  return <PageShell path={path} name="Code Lab" description={description}><CodeLab /></PageShell>
}
