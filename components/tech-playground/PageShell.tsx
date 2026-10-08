import type { ReactNode } from 'react'
import Container from '../ui/Container'
import JsonLd from '../shared/JsonLd'
import TrackView from './TrackView'
import { getSiteUrl } from '../../lib/seo'
import { webPageJsonLd } from '../../lib/structured-data'

export default function PageShell({ path, name, description, children, narrow = true, flush = false }: { path: string; name: string; description: string; children: ReactNode; narrow?: boolean; flush?: boolean }) {
  return (
    <section className={`section pg-page${flush ? ' pg-page--flush' : ''}`}>
      <JsonLd data={webPageJsonLd(getSiteUrl(), { type: 'WebPage', path, name, description })} />
      <TrackView page={path} />
      <Container className={narrow ? 'max-w-4xl' : 'max-w-6xl'}>{children}</Container>
    </section>
  )
}
