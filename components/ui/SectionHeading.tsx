function AccentHeading({ title }: { title: string }) {
  const words = title.trim().split(/\s+/)
  if (words.length < 2) return <>{title}</>
  const last = words.pop()
  return <>{words.join(' ')} <span className="heading-accent">{last}</span></>
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left'
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
}) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : ''
  return (
    <div className={`section-heading max-w-2xl ${alignClass}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="h-section mt-2"><AccentHeading title={title} /></h2>
      {description && <p className="lede mt-3">{description}</p>}
    </div>
  )
}
