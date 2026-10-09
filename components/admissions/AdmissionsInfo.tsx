import Link from 'next/link'
import { CalendarDays, ClipboardCheck, GraduationCap, MessageCircle, UserCheck, Wallet, type LucideIcon } from 'lucide-react'
import IconTile from '../ui/IconTile'

/**
 * Admissions page: "What you'll need" checklist and "Good to know" panel.
 * The checklist is driven by data/site.ts (admissionsRequirements); icons are
 * picked from keywords so edits to that list keep working.
 */
const REQ_ICONS: Array<[RegExp, LucideIcon]> = [
  [/identif|passport|\bid\b/i, UserCheck],
  [/academic|certificate|result|transcript/i, GraduationCap],
  [/form|application|enquiry/i, ClipboardCheck],
  [/payment|fee|registration/i, Wallet]
]

export function RequirementsChecklist({ items }: { items: string[] }) {
  return (
    <ul className="need-card">
      {items.map((r) => {
        const Icon = REQ_ICONS.find(([re]) => re.test(r))?.[1] ?? ClipboardCheck
        return (
          <li key={r} className="need-item">
            <IconTile icon={Icon} tone="teal" size="md" />
            <span className="need-text">{r}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function IntakesAndFees() {
  return (
    <div className="know-card">
      <div className="know-fact">
        <IconTile icon={CalendarDays} tone="amber" size="md" className="know-tile" />
        <div>
          <p className="know-title">Intake dates</p>
          <p className="know-text">Vary by programme and are confirmed directly with the admissions office.</p>
        </div>
      </div>
      <div className="know-fact">
        <IconTile icon={Wallet} tone="amber" size="md" className="know-tile" />
        <div>
          <p className="know-title">Fee structures</p>
          <p className="know-text">Also vary by programme and are confirmed directly with the admissions office.</p>
        </div>
      </div>
      <div className="know-foot">
        <p className="know-text">Get in touch and we&apos;ll walk you through current options for your chosen track.</p>
        <Link href="/contact" className="btn btn-accent">
          <MessageCircle size={17} aria-hidden="true" />
          Ask admissions a question
        </Link>
      </div>
    </div>
  )
}
