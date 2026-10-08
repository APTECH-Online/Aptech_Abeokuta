import {
  BarChart3, Bug, BrainCircuit, Cloud, Code2, Cpu, Database, FileText, Globe,
  Layers, Network, Palette, Rocket, ShieldCheck, Smartphone, Sparkles,
  type LucideIcon
} from 'lucide-react'
import IconTile from '../ui/IconTile'

/**
 * "What you'll learn" cards, shared by the course detail page and campaign
 * landing pages. Highlights are free text from the CMS, so the component adapts:
 *  - "Lead: detail" / "Lead — detail" strings get a bold lead and a quieter detail line
 *  - a trailing "; exit profile: X" (used by ACNS) becomes its own small tag
 *  - everything else renders as a single, slightly heavier line
 * The icon is picked from keywords in the text and falls back to a neutral one.
 */

const ICON_RULES: Array<[RegExp, LucideIcon]> = [
  [/ethical hack|security|cyber/, ShieldCheck],
  [/machine learning|artificial intelligence|\bai\b|nlp|deep learning/, BrainCircuit],
  [/\biot\b|hardware|linux|desktop|server/, Cpu],
  [/network|routing|switching|cisco/, Network],
  [/azure|cloud/, Cloud],
  [/database|\bsql\b|relational/, Database],
  [/mobile|flutter|android/, Smartphone],
  [/\bweb\b|website|html|css|javascript|react|django/, Globe],
  [/data science|analytic|pivot|excel|dashboard|tableau|spreadsheet|chart/, BarChart3],
  [/design|colour|typograph|image editing|vector|logo/, Palette],
  [/testing|selenium|debug|troubleshoot/, Bug],
  [/project/, Rocket],
  [/agile|devops/, Layers],
  [/programming|java|c#|python|\bcode\b|object-oriented|syntax|application development/, Code2],
  [/document|word|powerpoint|outlook|email|presentation/, FileText]
]

function pickIcon(text: string): LucideIcon {
  const t = text.toLowerCase()
  return ICON_RULES.find(([re]) => re.test(t))?.[1] ?? Sparkles
}

type Parsed = { lead: string; detail?: string; tag?: string }

function parse(raw: string): Parsed {
  let text = raw.trim()
  let tag: string | undefined

  const exit = text.match(/^(.*?)[;,.]?\s*exit profile:\s*(.+)$/i)
  if (exit && exit[1].trim()) {
    text = exit[1].trim()
    tag = exit[2].trim().replace(/\.$/, '')
  }

  const m = text.match(/^(.{2,48}?)(?::\s+|\s+[—–]\s+)(.+)$/)
  if (m && m[1].split(/\s+/).length <= 6 && m[2].split(/\s+/).length >= 3) {
    const detail = m[2].trim()
    return { lead: m[1].trim(), detail: detail.charAt(0).toUpperCase() + detail.slice(1), tag }
  }
  return { lead: text, tag }
}

export default function LearnCards({ items, className = '' }: { items: string[]; className?: string }) {
  if (!items.length) return null
  return (
    <ul className={`learn-grid ${className}`.trim()}>
      {items.map((raw) => {
        const { lead, detail, tag } = parse(raw)
        return (
          <li key={raw} className="learn-card">
            <IconTile icon={pickIcon(raw)} tone="navy" size="md" />
            <div className="learn-body">
              <p className={detail ? 'learn-lead' : 'learn-plain'}>{lead}</p>
              {detail && <p className="learn-detail">{detail}</p>}
              {tag && <span className="badge badge-amber learn-tag">Exit profile: {tag}</span>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
