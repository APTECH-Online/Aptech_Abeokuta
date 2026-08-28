import Link from 'next/link'

export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:underline" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" style={{ color: '#fff' }}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
