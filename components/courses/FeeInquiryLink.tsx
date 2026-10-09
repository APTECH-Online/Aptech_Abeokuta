'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { trackConversionEvent } from '../../lib/conversion-events'

export default function FeeInquiryLink({ href, programmeSlug, className, style, children }: {
  href: string; programmeSlug: string; className?: string; style?: CSSProperties; children: ReactNode
}) {
  return <Link href={href} className={className} style={style} onClick={() => trackConversionEvent('fee_inquiry', { programmeSlug, action: 'fees_and_intake_link' })}>{children}</Link>
}
