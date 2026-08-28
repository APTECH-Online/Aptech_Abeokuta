import Image from 'next/image'

const items = [
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

export default function Testimonials() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((it) => (
          <blockquote key={it.id} className="card p-6 flex flex-col h-full">
            <p aria-hidden="true" className="font-display text-3xl leading-none" style={{ color: 'var(--color-teal-100)' }}>“</p>
            <p className="mt-2 text-[0.95rem] leading-relaxed flex-1" style={{ color: 'var(--color-ink)' }}>{it.quote}</p>
            <footer className="mt-4 pt-4 flex items-center gap-3" style={{ borderTop: '1px solid var(--color-line)' }}>
              <span className="relative shrink-0 rounded-full overflow-hidden" style={{ width: 40, height: 40 }}>
                <Image src={it.image} alt={it.name} fill sizes="40px" className="object-cover" />
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
