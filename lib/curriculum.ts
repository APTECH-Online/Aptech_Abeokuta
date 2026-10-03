/**
 * Plain-text curriculum format, editable in one box in the CRM.
 *
 *   ## Term 1: Programming Foundations | 120 Hours
 *   An optional description line directly under a heading.
 *   - Introduction to C :: Write and debug small C programs
 *   - Data structures
 *
 *   ## Term 2: Web development
 *   - HTML5 and CSS3
 *
 * "## Title | Subtitle" starts a block (the subtitle, usually hours, is optional).
 * "- Name :: detail" is a module (the detail is optional).
 * Any other non-blank line directly after a heading is that block's description.
 *
 * Pure functions, no I/O, so the same parser validates on save and renders on
 * the public page. Content is plain text only: never inserted as HTML.
 */

export type CurriculumModule = { name: string; detail?: string }
export type CurriculumBlock = { title: string; subtitle?: string; description?: string; modules: CurriculumModule[] }
export type CurriculumError = { line: number; message: string }

export const CURRICULUM_LIMITS = { blocks: 30, modulesPerBlock: 60, title: 120, subtitle: 80, name: 160, detail: 400, description: 600 }

export function parseCurriculum(source: string | null | undefined): { blocks: CurriculumBlock[]; errors: CurriculumError[] } {
  const blocks: CurriculumBlock[] = []
  const errors: CurriculumError[] = []
  if (!source || !source.trim()) return { blocks, errors }
  const L = CURRICULUM_LIMITS
  let current: CurriculumBlock | null = null

  source.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim()
    const n = i + 1
    if (!line) return

    if (line.startsWith('##')) {
      const [titleRaw, ...rest] = line.replace(/^##\s*/, '').split('|')
      const title = titleRaw.trim()
      const subtitle = rest.join('|').trim()
      if (!title) return void errors.push({ line: n, message: 'A "##" heading needs a title.' })
      if (title.length > L.title) errors.push({ line: n, message: `Heading is longer than ${L.title} characters.` })
      if (subtitle.length > L.subtitle) errors.push({ line: n, message: `Subtitle is longer than ${L.subtitle} characters.` })
      if (blocks.length >= L.blocks) return void errors.push({ line: n, message: `At most ${L.blocks} headings are allowed.` })
      current = { title, ...(subtitle ? { subtitle } : {}), modules: [] }
      blocks.push(current)
      return
    }

    if (!current) {
      errors.push({ line: n, message: 'Start with a heading line such as "## Term 1 | 120 Hours" before adding modules.' })
      return
    }

    if (/^[-*•]\s+/.test(line)) {
      const [nameRaw, ...rest] = line.replace(/^[-*•]\s+/, '').split('::')
      const name = nameRaw.trim()
      const detail = rest.join('::').trim()
      if (!name) return void errors.push({ line: n, message: 'A module needs a name after "-".' })
      if (name.length > L.name) errors.push({ line: n, message: `Module name is longer than ${L.name} characters.` })
      if (detail.length > L.detail) errors.push({ line: n, message: `Module detail is longer than ${L.detail} characters.` })
      if (current.modules.length >= L.modulesPerBlock) return void errors.push({ line: n, message: `At most ${L.modulesPerBlock} modules per heading.` })
      current.modules.push({ name, ...(detail ? { detail } : {}) })
      return
    }

    // Plain text directly under a heading (before its first module) = description.
    if (current.modules.length === 0) {
      const next = current.description ? `${current.description} ${line}` : line
      if (next.length > L.description) errors.push({ line: n, message: `Description is longer than ${L.description} characters.` })
      current.description = next
    } else {
      errors.push({ line: n, message: 'Start module lines with "- ". Plain text is only allowed directly under a heading.' })
    }
  })

  blocks.forEach((b) => {
    if (b.modules.length === 0 && !b.description) errors.push({ line: 0, message: `"${b.title}" has no modules or description.` })
  })
  return { blocks, errors }
}
