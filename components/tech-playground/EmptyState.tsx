import Link from 'next/link'
import { ArrowRight, ChevronLeft, Hourglass } from 'lucide-react'

/** Friendly placeholder for playground pages whose content is being prepared. */
export default function EmptyState({ title, text, href = '/tech-playground', cta = 'Back to Tech Playground' }: { title: string; text: string; href?: string; cta?: string }) {
  return (
    <div className="pf pgx-empty">
      <div className="pf__glow" aria-hidden="true" />
      <div className="pf__dots" aria-hidden="true" />
      <div className="pf__inner">
        <Link href="/tech-playground" className="pgx-back"><ChevronLeft size={15} aria-hidden="true" /> Tech Playground</Link>
        <div className="pgx-empty__body">
          <span className="pgx-empty__icon" aria-hidden="true"><Hourglass size={26} /></span>
          <h1 className="pf__question">{title}</h1>
          <p className="pg-muted">{text}</p>
          <Link href={href} className="btn btn-accent mt-4">{cta} <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      </div>
    </div>
  )
}
