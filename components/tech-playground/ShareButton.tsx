'use client'

import { Share2 } from 'lucide-react'
import { trackConversionEvent } from '../../lib/conversion-events'

/** Shares a generic achievement message + public URL. No personal details are included. */
export default function ShareButton({ text, path = '/tech-playground', label = 'Share Your Achievement' }: { text: string; path?: string; label?: string }) {
  async function share() {
    trackConversionEvent('playground_share_clicked', { path })
    const url = `${window.location.origin}${path}`
    try {
      if (navigator.share) { await navigator.share({ title: 'APTECH Tech Playground', text, url }); return }
    } catch { return /* user cancelled */ }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener,noreferrer')
  }
  return <button type="button" className="btn btn-secondary" onClick={share}><Share2 size={15} /> {label}</button>
}
