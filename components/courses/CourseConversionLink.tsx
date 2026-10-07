'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { trackConversionEvent } from '../../lib/conversion-events'

export default function CourseConversionLink({
  href,
  children,
  event,
  metadata,
  className = ''
}: {
  href: string
  children: ReactNode
  event: 'application_cta_clicked' | 'enquiry_cta_clicked'
  metadata?: Record<string, unknown>
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`btn btn-accent ${className}`}
      onClick={() => trackConversionEvent(event, metadata)}
    >
      {children}
    </Link>
  )
}
