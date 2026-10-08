import Image from 'next/image'
import { Quote } from 'lucide-react'
import type { PublicTestimonial } from '../../lib/testimonials-public'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)
  return letters.toUpperCase()
}

/**
 * Shared student-story card (homepage, student life, /testimonials).
 * Quote leads; the person (photo, name, programme) closes it, separated by a
 * dashed "thread" line that echoes the adire stitch pattern.
 */
export default function StoryCard({
  item,
  active = false,
  size = 'md'
}: {
  item: PublicTestimonial
  active?: boolean
  size?: 'md' | 'lg'
}) {
  return (
    <figure className={`story-card ${size === 'lg' ? 'story-card-lg' : ''} ${active ? 'story-card-active' : ''}`}>
      <span className="story-card-mark" aria-hidden="true">
        <Quote size={16} strokeWidth={2.5} />
      </span>
      <blockquote className="story-card-quote">{item.quote}</blockquote>
      <figcaption className="story-card-person">
        <span className="story-card-avatar">
          {item.image_url ? (
            <Image src={item.image_url} alt={`Photo of ${item.name}`} fill sizes="52px" className="object-cover" />
          ) : (
            <span aria-hidden="true">{initials(item.name)}</span>
          )}
        </span>
        <span className="min-w-0">
          <span className="story-card-name">{item.name}</span>
          <span className="story-card-programme">{item.program}</span>
        </span>
      </figcaption>
    </figure>
  )
}
