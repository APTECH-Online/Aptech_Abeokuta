import Image from 'next/image'
import Link from 'next/link'
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
  const programme = item.programme_slug || item.program.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const storyTypeLabel: Record<string, string> = { testimonial: 'Student voice', student_project: 'Student project', graduate_experience: 'Graduate experience', employer_outcome: 'Employer outcome', certification_outcome: 'Certification outcome' }
  return (
    <figure className={`story-card ${size === 'lg' ? 'story-card-lg' : ''} ${active ? 'story-card-active' : ''}`}>
      <span className="story-card-mark" aria-hidden="true">
        <Quote size={16} strokeWidth={2.5} />
      </span>
      <span className="inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--color-navy-100)', color: 'var(--color-navy-700)' }}>{storyTypeLabel[item.story_type] || 'Student story'}</span>
      {item.project_title && <h3 className="mt-3 font-semibold" style={{ color: 'var(--color-ink)' }}>{item.project_title}</h3>}
      <blockquote className="story-card-quote">{item.quote}</blockquote>
      {item.story_summary && <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>{item.story_summary}</p>}
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
      <Link href={`/contact?programme=${encodeURIComponent(item.program)}&story=${encodeURIComponent(item.id)}`} className="btn btn-secondary btn-sm mt-4 w-full">Ask about {item.program}</Link>
    </figure>
  )
}
