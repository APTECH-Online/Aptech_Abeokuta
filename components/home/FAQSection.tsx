import { MessageCircle } from 'lucide-react'
import type { PublicFaq } from '../../lib/faqs-public'
import Accordion from '../ui/Accordion'
import IconTile from '../ui/IconTile'
import AdvisorGuide from './AdvisorGuide'

/** Homepage FAQ: editorial intro panel + accordion. Heading and answers render on the server. */
export default function FAQSection({ faqs, whatsapp }: { faqs: PublicFaq[]; whatsapp: string }) {
  const items = faqs.map((f) => ({ id: f.id, title: f.question, content: f.answer }))
  return (
    <div className="faq-layout">
      <aside className="faq-intro">
        <p className="eyebrow">FAQ</p>
        <h2 className="h-section mt-2">Frequently asked questions</h2>
        <p className="lede mt-3">Everything you need to know before choosing your programme and starting your journey at APTECH Abeokuta.</p>
        <div className="faq-help">
          <IconTile icon={MessageCircle} tone="amber" />
          <div>
            <p className="faq-help__title">Need help choosing?</p>
            <p className="faq-help__text">Our admissions team can match you to the right programme and walk you through next steps.</p>
          </div>
          <AdvisorGuide whatsapp={whatsapp} label="Talk to Admissions" />
        </div>
      </aside>
      <div className="faq-main"><Accordion items={items} /></div>
    </div>
  )
}
