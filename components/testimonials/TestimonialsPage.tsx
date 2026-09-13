'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import type { PublicTestimonial } from '../../lib/testimonials-public'

function initials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

export default function TestimonialsPage({ testimonials }: { testimonials: PublicTestimonial[] }) {
  const [active, setActive] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const item = testimonials[active]

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setActive((v) => (v + 1) % testimonials.length)
      if (event.key === 'ArrowLeft') setActive((v) => (v - 1 + testimonials.length) % testimonials.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [testimonials.length])

  if (testimonials.length === 0 || !item) {
    return (
      <div className="card p-10 text-center">
        <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>No testimonials yet</p>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>Check back soon for student stories.</p>
      </div>
    )
  }

  return (
    <>
      <section
        className="testimonial-feature pattern-adire"
        onTouchStart={(event) => setTouchStart(event.changedTouches[0]?.clientX ?? null)}
        onTouchEnd={(event) => {
          if (touchStart === null) return
          const end = event.changedTouches[0]?.clientX ?? touchStart
          const delta = end - touchStart
          if (Math.abs(delta) > 50) {
            setActive((v) => delta < 0 ? (v + 1) % testimonials.length : (v - 1 + testimonials.length) % testimonials.length)
          }
          setTouchStart(null)
        }}
      >
        <div className="testimonial-feature-copy">
          <Quote className="mt-8" size={34} aria-hidden="true" style={{ color: 'var(--color-amber-400)' }} />
          <blockquote className="mt-4 font-display text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight text-white">“{item.quote}”</blockquote>
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="font-semibold text-white">{item.name}</p>
            <p className="mt-1 text-sm text-white/60">{item.program}</p>
          </div>
        </div>
        <div className="testimonial-feature-image">
          {item.image_url ? (
            <Image src={item.image_url} alt={`Photo of ${item.name}, ${item.program} student`} fill sizes="(max-width: 1023px) 100vw, 42vw" className="object-cover" priority />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--color-navy-800)' }}>
              <span className="h-display" style={{ color: 'rgba(239,192,119,0.9)', fontSize: '3rem' }}>{initials(item.name)}</span>
            </div>
          )}
        </div>
      </section>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-xs text-[var(--color-muted)]">Use the arrows or keyboard to browse student stories.</p>
        <div className="flex gap-2">
          <button className="btn btn-secondary !p-2.5" type="button" onClick={() => setActive((v) => (v - 1 + testimonials.length) % testimonials.length)} aria-label="Previous testimonial"><ChevronLeft size={18} /></button>
          <button className="btn btn-secondary !p-2.5" type="button" onClick={() => setActive((v) => (v + 1) % testimonials.length)} aria-label="Next testimonial"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="testimonial-editorial-grid mt-10">
        {testimonials.map((t, index) => (
          <article key={t.id} className={`card p-6 sm:p-7 ${index === active ? 'testimonial-card-active' : ''}`}>
            <p className="font-display text-lg font-semibold leading-relaxed text-[var(--color-ink)]">“{t.quote}”</p>
            <div className="mt-6 pt-5 border-t border-[var(--color-line)] flex items-center gap-3">
              <span className="relative shrink-0 rounded-full overflow-hidden flex items-center justify-center" style={{ width: 44, height: 44, background: 'var(--color-navy-100)' }}>
                {t.image_url ? (
                  <Image src={t.image_url} alt={t.name} fill sizes="44px" className="object-cover" />
                ) : (
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-navy-700)' }}>{initials(t.name)}</span>
                )}
              </span>
              <span>
                <span className="block text-sm font-semibold text-[var(--color-ink)]">{t.name}</span>
                <span className="block text-xs text-[var(--color-muted)]">{t.program}</span>
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-6"><p className="eyebrow">Practical</p><h3 className="font-display font-semibold mt-3">Learn by doing</h3><p className="mt-2 text-sm leading-relaxed text-[var(--color-body)]">Every programme is built around hands-on projects and lab-based practice, not passive lectures.</p></div>
        <div className="card p-6"><p className="eyebrow">Support</p><h3 className="font-display font-semibold mt-3">Guidance matters</h3><p className="mt-2 text-sm leading-relaxed text-[var(--color-body)]">Instructors stay accessible throughout, with a structured pathway from fundamentals to applied work.</p></div>
        <div className="card p-6"><p className="eyebrow">Community</p><h3 className="font-display font-semibold mt-3">A local learning community</h3><p className="mt-2 text-sm leading-relaxed text-[var(--color-body)]">A campus in Abeokuta, connected to the wider APTECH computer education network.</p></div>
      </div>
    </>
  )
}
