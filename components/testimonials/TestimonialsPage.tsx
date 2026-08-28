'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    quote: "I'm so grateful for the supportive learning environment at Aptech. The instructors are always available to answer our questions and provide guidance, and my fellow students are incredibly talented and motivated. We're all learning and growing together, and it's an amazing experience.",
    name: 'Lesley',
    program: 'ADSE',
    image: '/images/testimonials/lesley.jpg'
  },
  {
    id: 2,
    quote: "The ADSE program at Aptech is giving me the skills and confidence to pursue my dream of becoming a software engineer. I'm learning the latest technologies and best practices, and I'm building a strong foundation for a successful career in the tech industry.",
    name: 'James',
    program: 'ADSE',
    image: '/images/testimonials/james.jpg'
  },
  {
    id: 3,
    quote: "I'm really impressed with the breadth and depth of the ADSE curriculum. We're covering everything from database management to cloud computing, and I'm gaining a holistic understanding of the software development lifecycle. The instructors are experts in their field and provide great guidance and support.",
    name: 'Khalid',
    program: 'ADSE',
    image: '/images/testimonials/khalid.jpg'
  }
]

export default function TestimonialsPage() {
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
  }, [])

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
          <Image src={item.image} alt={`Photo of ${item.name}, ${item.program} student`} fill sizes="(max-width: 1023px) 100vw, 42vw" className="object-cover" priority />
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
              <span className="relative shrink-0 rounded-full overflow-hidden" style={{ width: 44, height: 44 }}>
                <Image src={t.image} alt={t.name} fill sizes="44px" className="object-cover" />
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
        <div className="card p-6"><p className="eyebrow">Practical</p><h3 className="font-display font-semibold mt-3">Learn by doing</h3><p className="mt-2 text-sm leading-relaxed text-[var(--color-body)]">Existing site content emphasises hands-on projects and lab-based learning.</p></div>
        <div className="card p-6"><p className="eyebrow">Support</p><h3 className="font-display font-semibold mt-3">Guidance matters</h3><p className="mt-2 text-sm leading-relaxed text-[var(--color-body)]">The site describes instructor support and a structured learning pathway.</p></div>
        <div className="card p-6"><p className="eyebrow">Community</p><h3 className="font-display font-semibold mt-3">A local learning community</h3><p className="mt-2 text-sm leading-relaxed text-[var(--color-body)]">APTECH Abeokuta is presented as a local campus within the wider APTECH computer education network.</p></div>
      </div>
    </>
  )
}
