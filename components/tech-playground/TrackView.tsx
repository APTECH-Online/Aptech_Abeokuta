'use client'
import { useEffect } from 'react'
import { captureAttribution } from '../../lib/attribution'
import { trackConversionEvent } from '../../lib/conversion-events'

export default function TrackView({ page }: { page: string }) {
  useEffect(() => { captureAttribution(window.location.search); trackConversionEvent('playground_viewed', { page }) }, [page])
  return null
}
