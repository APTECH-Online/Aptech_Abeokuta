import { faqs } from '../../data/site'
import Accordion from '../ui/Accordion'

export default function FAQSection() {
  const items = faqs.map((f) => ({ id: f.id, title: f.question, content: f.answer }))
  return <Accordion items={items} />
}
