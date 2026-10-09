'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import type { PublicGalleryItem } from '../../lib/gallery-public'

export type GalleryItem = PublicGalleryItem

const DEFAULT_FILTERS = ['All']

export default function Gallery({ items }: { items: GalleryItem[] }) {
  const filters = [...DEFAULT_FILTERS, ...Array.from(new Set(items.map((i) => i.category)))]
  const countFor = (name: string) => (name === 'All' ? items.length : items.filter((i) => i.category === name).length)
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState<string | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchStartX = useRef<number | null>(null)

  const visible = items.filter((item) => filter === 'All' || item.category === filter)
  const selectedIndex = selected === null ? -1 : visible.findIndex((item) => item.id === selected)
  const selectedItem = selectedIndex >= 0 ? visible[selectedIndex] : null

  const step = useCallback(
    (dir: 1 | -1) => {
      if (visible.length < 2 || selectedIndex < 0) return
      setSelected(visible[(selectedIndex + dir + visible.length) % visible.length].id)
    },
    [visible, selectedIndex]
  )

  // Close and hand focus back to the tile that opened the viewer.
  const close = useCallback(() => {
    setSelected(null)
    const trigger = triggerRef.current
    if (trigger && document.contains(trigger)) requestAnimationFrame(() => trigger.focus())
  }, [])

  const isOpen = selected !== null
  useEffect(() => {
    if (!isOpen) return
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'))
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, close, step])

  return (
    <>
      <div className="gallery-toolbar">
        <div className="gallery-filters" role="group" aria-label="Filter gallery by category">
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
              <span className="chip-count" aria-hidden="true">{countFor(name)}</span>
              <span className="sr-only"> ({countFor(name)} photos)</span>
            </button>
          ))}
        </div>
        <p className="gallery-status" aria-live="polite">
          {filter === 'All' ? `${visible.length} photos` : `Showing ${visible.length} of ${items.length} photos`}
        </p>
      </div>

      {visible.length > 0 ? (
        <div className="gallery-grid mt-6">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`gallery-tile gallery-${item.display_size}`}
              onClick={(e) => {
                triggerRef.current = e.currentTarget
                setSelected(item.id)
              }}
              aria-label={`Open ${item.title}`}
              aria-haspopup="dialog"
            >
              <Image
                src={item.image_url}
                alt={item.alt_text}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
                className="gallery-img object-cover"
              />
              <span className="gallery-zoom" aria-hidden="true"><ZoomIn size={17} strokeWidth={2} /></span>
              <span className="gallery-caption">
                <span className="gallery-cat">{item.category}</span>
                <strong>{item.title}</strong>
              </span>
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
        <div
          ref={dialogRef}
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedItem.title} preview`}
          onMouseDown={(e) => e.target === e.currentTarget && close()}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return
            const dx = e.changedTouches[0].clientX - touchStartX.current
            touchStartX.current = null
            if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1)
          }}
        >
          <button ref={closeRef} type="button" className="gallery-close" onClick={close} aria-label="Close image preview"><X size={20} /></button>
          <div className="gallery-lightbox-content" key={selectedItem.id}>
            <div className="gallery-lightbox-media">
              <Image src={selectedItem.image_url} alt={selectedItem.alt_text} fill sizes="90vw" className="object-contain" priority />
            </div>
            <div className="gallery-lightbox-copy">
              <div className="min-w-0">
                <span className="badge badge-amber">{selectedItem.category}</span>
                <h2 className="gallery-lightbox-title">{selectedItem.title}</h2>
              </div>
              {visible.length > 1 && (
                <p className="gallery-counter" aria-label={`Image ${selectedIndex + 1} of ${visible.length}`}>
                  {selectedIndex + 1} <span aria-hidden="true">/</span> {visible.length}
                </p>
              )}
            </div>
          </div>
          {visible.length > 1 && (
            <>
              <button type="button" className="gallery-nav gallery-nav-prev" onClick={() => step(-1)} aria-label="Previous image"><ChevronLeft size={22} /></button>
              <button type="button" className="gallery-nav gallery-nav-next" onClick={() => step(1)} aria-label="Next image"><ChevronRight size={22} /></button>
            </>
          )}
        </div>
      )}
    </>
  )
}
