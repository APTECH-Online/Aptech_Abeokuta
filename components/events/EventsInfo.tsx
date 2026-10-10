import Link from 'next/link'
import { Building2, Code2, GraduationCap, MessageCircle, Monitor, Ticket, type LucideIcon } from 'lucide-react'
import IconTile from '../ui/IconTile'

/**
 * Events page: "What you can attend" and "Good to know". These deliberately reuse
 * the admissions page's need-card / know-card styles so the two pages read as
 * one family.
 */
const ATTEND: Array<{ icon: LucideIcon; text: string }> = [
  { icon: Code2, text: 'Introductory coding workshops' },
  { icon: Monitor, text: 'Technology career talks and live demonstrations' },
  { icon: MessageCircle, text: 'Programme discovery and admissions Q&A' },
  { icon: Building2, text: 'Campus open days and learning experiences' }
]

export function WhatYouCanAttend() {
  return (
    <ul className="need-card">
      {ATTEND.map(({ icon, text }) => (
        <li key={text} className="need-item">
          <IconTile icon={icon} tone="teal" size="md" />
          <span className="need-text">{text}</span>
        </li>
      ))}
    </ul>
  )
}

export function GoodToKnow() {
  return (
    <div className="know-card">
      <div className="know-fact">
        <IconTile icon={Ticket} tone="amber" size="md" className="know-tile" />
        <div>
          <p className="know-title">Free to attend</p>
          <p className="know-text">Our workshops, webinars and open days are free. Pick a session and register in a minute.</p>
        </div>
      </div>
      <div className="know-fact">
        <IconTile icon={GraduationCap} tone="amber" size="md" className="know-tile" />
        <div>
          <p className="know-title">Not an admission application</p>
          <p className="know-text">Registering for an event does not start an application. You can apply any time from the admissions page.</p>
        </div>
      </div>
      <div className="know-foot">
        <p className="know-text">Can&apos;t see a session that suits you? Check back soon, or ask our team what&apos;s coming up.</p>
        <Link href="/contact" className="btn btn-accent">
          <MessageCircle size={17} aria-hidden="true" />
          Ask our team
        </Link>
      </div>
    </div>
  )
}
