'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export type GalleryItem = {
  id: number
  title: string
  category: string
  src?: string
  alt: string
  size: 'feature' | 'tall' | 'standard'
  placeholder?: boolean
}

const items: GalleryItem[] = [
  {
    id: 1,
    title: 'Technology learning environment',
    category: 'Learning',
    src: '/images/hero-tech.svg',
    alt: 'Illustration representing technology-focused learning',
    size: 'feature'
  },
  {
    id: 2,
    title: 'Students building practical skills',
    category: 'Students',
    src: '/images/about-illustration.svg',
    alt: 'Illustration of a student working with a laptop, code panels and a data chart',
    size: 'tall'
  },
  {
    id: 3,
    title: 'Staff at work',
    category: 'Campus',
    src: '/images/gallery/staff-1.jpg',
    alt: 'A staff member working at a desk with a laptop on campus',
    size: 'standard'
  },
  {
    id: 4,
    title: 'Classroom activity',
    category: 'Classes',
    alt: 'Placeholder for an approved APTECH Abeokuta classroom photograph',
    size: 'standard',
    placeholder: true
  },
  {
    id: 5,
    title: 'Office and admin team',
    category: 'Campus',
    src: '/images/gallery/staff-2.jpg',
    alt: 'A staff member working at a desk in an office on campus',
    size: 'tall'
  },
  {
    id: 6,
    title: 'Around the campus',
    category: 'Campus',
    src: '/images/gallery/campus-1.jpg',
    alt: 'A student walking through a corridor on the APTECH Abeokuta campus',
    size: 'standard'
  },
  {
    id: 7,
    title: 'Career Quest event',
    category: 'Events',
    src: '/images/gallery/event-1.jpg',
    alt: 'A group of students at the APTECH Career Quest event, in association with Middlesex University',
    size: 'standard'
  },
  {
    id: 8,
    title: 'Technology and practice',
    category: 'Technology',
    src: '/images/hero-tech.svg',
    alt: 'Technology illustration used as a temporary visual until an approved campus image is supplied',
    size: 'standard'
  }
]

const filters = ['All', 'Campus', 'Students', 'Classes', 'Technology', 'Events', 'Learning']

export default function Gallery() {
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState<number | null>(null)

  const visible = items.filter((item) => filter === 'All' || item.category === filter)
  const selectedIndex = selected === null ? -1 : visible.findIndex((item) => item.id === selected)
  const selectedItem = selectedIndex >= 0 ? visible[selectedIndex] : null

  useEffect(() => {
    if (selected === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
      if (event.key === 'ArrowRight' && visible.length > 1) {
        setSelected(visible[(selectedIndex + 1) % visible.length].id)
      }
      if (event.key === 'ArrowLeft' && visible.length > 1) {
        setSelected(visible[(selectedIndex - 1 + visible.length) % visible.length].id)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [selected, selectedIndex, visible])

  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter gallery by category">
        {filters.map((name) => (
          <button
            key={name}
            type="button"
            className="chip"
            aria-pressed={filter === name}
            onClick={() => {
              setFilter(name)
              setSelected(null)
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className="gallery-grid mt-8" aria-live="polite">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`gallery-tile gallery-${item.size}`}
              onClick={() => setSelected(item.id)}
              aria-label={`Open ${item.title}`}
            >
              {item.placeholder ? (
                <div className="gallery-placeholder">
                  <span className="badge badge-navy">Image placeholder</span>
                  <span className="mt-3 font-display font-semibold text-[var(--color-ink)]">{item.title}</span>
                  <span className="mt-1 text-xs text-[var(--color-muted)]">Replace with an approved APTECH Abeokuta photo</span>
                </div>
              ) : (
                <Image src={item.src!} alt={item.alt} fill sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.035]" />
              )}
              {!item.placeholder && <span className="gallery-caption"><span>{item.category}</span><strong>{item.title}</strong></span>}
            </button>
          ))}
        </div>
      ) : (
        <div className="card mt-8 py-16 px-6 text-center">
          <p className="eyebrow justify-center">Nothing here yet</p>
          <h2 className="h-section mt-3">No gallery images in this category</h2>
          <p className="mt-3 text-sm text-[var(--color-muted)]">Approved photography can be added to this category without changing the gallery layout.</p>
        </div>
      )}

      {selectedItem && (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={`${selectedItem.title} preview`} onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
          <button type="button" className="gallery-close" onClick={() => setSelected(null)} aria-label="Close image preview"><X /></button>
          <div className="gallery-lightbox-content">
            <div className="gallery-lightbox-media">
              {selectedItem.placeholder ? (
                <div className="gallery-placeholder gallery-placeholder-large">
                  <span className="badge badge-navy">Image placeholder</span>
                  <span className="mt-3 font-display font-semibold">{selectedItem.title}</span>
                </div>
              ) : (
                <Image src={selectedItem.src!} alt={selectedItem.alt} fill sizes="90vw" className="object-contain" priority />
              )}
            </div>
            <div className="gallery-lightbox-copy">
              <span className="badge badge-amber">{selectedItem.category}</span>
              <h2 className="font-display text-xl sm:text-2xl font-semibold mt-3">{selectedItem.title}</h2>
            </div>
          </div>
          {visible.length > 1 && (
            <>
              <button type="button" className="gallery-nav gallery-nav-prev" onClick={() => setSelected(visible[(selectedIndex - 1 + visible.length) % visible.length].id)} aria-label="Previous image"><ChevronLeft /></button>
              <button type="button" className="gallery-nav gallery-nav-next" onClick={() => setSelected(visible[(selectedIndex + 1) % visible.length].id)} aria-label="Next image"><ChevronRight /></button>
            </>
          )}
        </div>
      )}
    </>
  )
}
