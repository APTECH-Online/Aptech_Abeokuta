'use client'

import { useEffect } from 'react'
import { trackConversionEvent } from '../../lib/conversion-events'

export default function ProgrammePageViewTracker({ programmeSlug, programmeName }: { programmeSlug: string; programmeName: string }) {
  useEffect(() => {
    trackConversionEvent('programme_page_viewed', { programmeSlug, programmeName, path: window.location.pathname })
  }, [programmeSlug, programmeName])
  return null
}
