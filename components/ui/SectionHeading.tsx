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
    <div className={`max-w-2xl ${alignClass}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="h-section mt-2">{title}</h2>
      {description && <p className="lede mt-3">{description}</p>}
    </div>
  )
}
