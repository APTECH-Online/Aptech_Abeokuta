'use client'
import { useEffect } from 'react'
import { captureAttribution } from '../../lib/attribution'
export default function AttributionCapture(){useEffect(()=>{captureAttribution(window.location.search)},[]);return null}
