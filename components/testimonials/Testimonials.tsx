import Image from 'next/image'
import type { PublicTestimonial } from '../../lib/testimonials-public'

export default function Testimonials({ items }: { items: PublicTestimonial[] }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((it) => (
          <blockquote key={it.id} className="card p-6 flex flex-col h-full">
            <p aria-hidden="true" className="font-display text-3xl leading-none" style={{ color: 'var(--color-teal-100)' }}>&ldquo;</p>
            <p className="mt-2 text-[0.95rem] leading-relaxed flex-1" style={{ color: 'var(--color-ink)' }}>{it.quote}</p>
            <footer className="mt-4 pt-4 flex items-center gap-3" style={{ borderTop: '1px solid var(--color-line)' }}>
              <span className="relative shrink-0 rounded-full overflow-hidden flex items-center justify-center" style={{ width: 40, height: 40, background: 'var(--color-navy-100)' }}>
                {it.image_url ? (
                  <Image src={it.image_url} alt={it.name} fill sizes="40px" className="object-cover" />
                ) : (
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-navy-700)' }}>{it.name.slice(0, 2).toUpperCase()}</span>
                )}
              </span>
              <span>
                <span className="block text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{it.name}</span>
                <span className="block text-xs" style={{ color: 'var(--color-muted)' }}>{it.program}</span>
              </span>
            </footer>
          </blockquote>
        ))}
      </div>
    </div>
  )
}
