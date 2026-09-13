import type { PublicFaq } from '../../lib/faqs-public'
import Accordion from '../ui/Accordion'

export default function FAQSection({ faqs }: { faqs: PublicFaq[] }) {
  const items = faqs.map((f) => ({ id: f.id, title: f.question, content: f.answer }))
  return <Accordion items={items} />
}
