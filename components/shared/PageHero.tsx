import { ReactNode } from 'react'
import Breadcrumbs from './Breadcrumbs'

export default function PageHero({
  eyebrow,
  title,
  description,
  crumbs,
  children
}: {
  eyebrow: string
  title: string
  description?: string
  crumbs: { label: string; href?: string }[]
  children?: ReactNode
}) {
  return (
    <section className="pattern-adire border-b hairline" style={{ background: 'var(--color-navy-900)' }}>
      <div className="container py-12 sm:py-16">
        <Breadcrumbs items={crumbs} />
        <p className="eyebrow eyebrow-inverse mt-5">{eyebrow}</p>
        <h1 className="h-display mt-2" style={{ color: '#fff' }}>{title}</h1>
        {description && (
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  )
}
