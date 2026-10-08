import type { PublicTestimonial } from '../../lib/testimonials-public'
import StoryCard from './StoryCard'

export default function Testimonials({ items }: { items: PublicTestimonial[] }) {
  return (
    <div className="story-grid">
      {items.map((it) => (
        <StoryCard key={it.id} item={it} />
      ))}
    </div>
  )
}
