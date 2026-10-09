import Link from 'next/link'
import { CalendarDays, CheckCircle2, Clock3, GraduationCap, MessageCircle } from 'lucide-react'
import Container from '../../../components/ui/Container'
import { getActiveProgrammesForPublicForm } from '../admissions/programmes'
import BookingForm from './BookingForm'

export const metadata = {
  title: 'Book Admissions Counselling | APTECH Abeokuta',
  description: 'Book a free admissions counselling session with APTECH Abeokuta. Meet an advisor on campus, by phone, or online and find the right technology programme for you.',
  alternates: { canonical: '/book-consultation' }
}

export default async function BookConsultationPage() {
  const programmes = await getActiveProgrammesForPublicForm()
  return <>
    <section className="relative overflow-hidden py-14 sm:py-20" style={{ background: '#1d1250', color: '#fff' }}>
      <Container className="relative z-10"><div className="max-w-3xl"><p className="eyebrow" style={{ color: '#f3c76a' }}>Your future starts with a conversation</p><h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">Let’s find the right <span style={{ color: '#f3c76a' }}>tech path</span> for you.</h1><p className="mt-5 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">Book a free admissions counselling session. Ask questions, explore programmes and get clear guidance on your next step—with no pressure.</p><div className="mt-7 flex flex-wrap gap-3"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm"><CheckCircle2 size={16} style={{ color: '#f3c76a' }}/>Free counselling</span><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm"><Clock3 size={16} style={{ color: '#f3c76a' }}/>About 15–20 minutes</span></div></div></Container>
    </section>
    <section className="section" style={{ background: 'var(--color-paper-alt)' }}><Container className="max-w-6xl"><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,1.08fr)] lg:gap-12"><aside className="lg:sticky lg:top-24 lg:self-start"><p className="eyebrow">What to expect</p><h2 className="h-section mt-2">A clearer path starts here.</h2><p className="mt-4 text-sm leading-7" style={{ color: 'var(--color-muted)' }}>A friendly conversation with our admissions team can help you make a confident, informed decision about your technology career.</p><div className="mt-7 grid gap-4">{[{ icon: GraduationCap, title: 'Explore your options', text: 'Compare programmes based on your goals, experience and interests.' }, { icon: MessageCircle, title: 'Get practical answers', text: 'Ask about course duration, learning schedules, fees and entry requirements.' }, { icon: CalendarDays, title: 'Choose a convenient time', text: 'Select an available weekday appointment in West Africa Time.' }].map(({icon: Icon,title,text}) => <div key={title} className="flex gap-4 rounded-2xl border p-4" style={{ background: 'var(--color-paper)', borderColor: 'var(--color-line)' }}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(29,18,80,.08)', color: '#1d1250' }}><Icon size={21}/></span><div><h3 className="font-semibold" style={{ color: 'var(--color-ink)' }}>{title}</h3><p className="mt-1 text-sm leading-6" style={{ color: 'var(--color-muted)' }}>{text}</p></div></div>)}</div><p className="mt-6 text-sm" style={{ color: 'var(--color-muted)' }}>Need help first? <Link className="font-semibold underline" href="/contact">Contact our team</Link> or <Link className="font-semibold underline" href="/courses">browse programmes</Link>.</p></aside><div><BookingForm programmes={programmes}/></div></div></Container></section>
  </>
}
