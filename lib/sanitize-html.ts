/**
 * Minimal allow-list HTML sanitizer for Insights rich content.
 *
 * The CRM editor (components/admin/RichTextEditor.tsx) is a plain
 * contentEditable surface producing a constrained set of tags — we don't
 * pull in a full sanitizer dependency (see the brief's "avoid unnecessary
 * package additions" guidance) but content is only ever written by
 * authenticated, permissioned staff and then rendered to public visitors,
 * so it's still worth stripping anything that could carry script
 * execution before it's stored.
 *
 * This is deliberately conservative: unknown tags are unwrapped (their
 * text content is kept, the tag itself is dropped) rather than removed
 * entirely, and only a small set of attributes survive on the tags that
 * are allowed to carry them.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'h2', 'h3', 'h4',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'img', 'figure', 'figcaption', 'div', 'span'
])

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt']),
}

export function sanitizeInsightHtml(html: string): string {
  if (!html) return ''

  // Strip script/style/iframe/object/embed blocks entirely, including their content.
  let out = html.replace(/<(script|style|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi, '')
  out = out.replace(/<(script|style|iframe|object|embed|form)[^>]*\/?>/gi, '')

  // Remove HTML comments (can hide conditional/legacy script vectors).
  out = out.replace(/<!--[\s\S]*?-->/g, '')

  // Walk tags and drop disallowed ones / attributes.
  out = out.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase()
    const isClosing = match.startsWith('</')

    if (!ALLOWED_TAGS.has(tag)) {
      // Unwrap: drop the tag but keep whatever text/children follow it.
      return ''
    }

    if (isClosing) return `</${tag}>`

    const allowedAttrs = ALLOWED_ATTRS[tag]
    if (!allowedAttrs) return `<${tag}>`

    const attrs: string[] = []
    const attrRegex = /([a-zA-Z-]+)\s*=\s*"([^"]*)"/g
    let m: RegExpExecArray | null
    while ((m = attrRegex.exec(rawAttrs))) {
      const [, name, value] = m
      const lname = name.toLowerCase()
      if (!allowedAttrs.has(lname)) continue
      // Never allow javascript:/data: URLs in href/src.
      if ((lname === 'href' || lname === 'src') && /^\s*(javascript|data):/i.test(value)) continue
      attrs.push(`${lname}="${value.replace(/"/g, '&quot;')}"`)
    }

    // Anchors always get a safe rel when they open in a new tab.
    if (tag === 'a' && attrs.some((a) => a.startsWith('target='))) {
      attrs.push('rel="noopener noreferrer"')
    }

    return attrs.length ? `<${tag} ${attrs.join(' ')}>` : `<${tag}>`
  })

  // Strip any remaining on* inline-event attributes that might have slipped
  // through inside an otherwise-allowed tag's attribute string.
  out = out.replace(/\son\w+\s*=\s*"[^"]*"/gi, '')

  return out.trim()
}
