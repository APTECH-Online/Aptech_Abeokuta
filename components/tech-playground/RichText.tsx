import type { ReactNode } from 'react'

/** Renders question text, turning ``` fenced blocks into code panels (text only, never HTML). */
export default function RichText({ text, className }: { text: string; className?: string }) {
  const parts: ReactNode[] = []
  const re = /```(?:\w+)?\n?([\s\S]*?)```/g
  let last = 0, m: RegExpExecArray | null, i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<p key={i++} className={className}>{text.slice(last, m.index).trim()}</p>)
    parts.push(<pre key={i++} className="pg-code" tabIndex={0}><code>{m[1].replace(/\n$/, '')}</code></pre>)
    last = m.index + m[0].length
  }
  if (last < text.length) { const rest = text.slice(last).trim(); if (rest) parts.push(<p key={i++} className={className}>{rest}</p>) }
  return <>{parts}</>
}
