'use client'

import { useEffect, useRef, useState } from 'react'
import { Bold, Italic, List, ListOrdered, Link2, Quote, Heading2, Heading3 } from 'lucide-react'

/**
 * A small contentEditable-based rich text editor. The brief asks us to
 * avoid pulling in a full editor library unless it's genuinely necessary
 * (see docs/ — Section 5 of the Insights brief); the content requirements
 * here (headings, bold/italic, lists, links, quotes) are simple enough
 * that document.execCommand, while old, still covers them reliably for a
 * trusted, staff-only authoring surface. Output HTML is sanitized again
 * server-side (lib/sanitize-html.ts) before it's ever stored.
 */
export default function RichTextEditor({
  name,
  defaultValue,
  error
}: {
  name: string
  defaultValue?: string
  error?: string
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [html, setHtml] = useState(defaultValue || '')
  const initialised = useRef(false)

  useEffect(() => {
    if (!initialised.current && editorRef.current) {
      editorRef.current.innerHTML = defaultValue || ''
      initialised.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function sync() {
    if (editorRef.current) setHtml(editorRef.current.innerHTML)
  }

  function exec(command: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    sync()
  }

  function insertLink() {
    const url = window.prompt('Link URL (https://…)')
    if (!url) return
    exec('createLink', url)
  }

  const ToolbarButton = ({
    onClick,
    label,
    children
  }: {
    onClick: () => void
    label: string
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
      className="p-1.5 rounded-md hover:bg-[var(--color-navy-50)] transition-colors"
      style={{ color: 'var(--color-ink)' }}
    >
      {children}
    </button>
  )

  return (
    <div>
      <div
        className="flex flex-wrap items-center gap-0.5 p-1.5 rounded-t-lg border border-b-0"
        style={{ borderColor: 'var(--color-line-strong)', background: 'var(--color-paper-alt)' }}
      >
        <ToolbarButton label="Heading 2" onClick={() => exec('formatBlock', '<h2>')}><Heading2 size={16} /></ToolbarButton>
        <ToolbarButton label="Heading 3" onClick={() => exec('formatBlock', '<h3>')}><Heading3 size={16} /></ToolbarButton>
        <ToolbarButton label="Paragraph" onClick={() => exec('formatBlock', '<p>')}><span className="text-xs font-semibold px-0.5">P</span></ToolbarButton>
        <span className="w-px h-5 mx-1" style={{ background: 'var(--color-line)' }} />
        <ToolbarButton label="Bold" onClick={() => exec('bold')}><Bold size={16} /></ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => exec('italic')}><Italic size={16} /></ToolbarButton>
        <ToolbarButton label="Quote" onClick={() => exec('formatBlock', '<blockquote>')}><Quote size={16} /></ToolbarButton>
        <span className="w-px h-5 mx-1" style={{ background: 'var(--color-line)' }} />
        <ToolbarButton label="Bulleted list" onClick={() => exec('insertUnorderedList')}><List size={16} /></ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => exec('insertOrderedList')}><ListOrdered size={16} /></ToolbarButton>
        <span className="w-px h-5 mx-1" style={{ background: 'var(--color-line)' }} />
        <ToolbarButton label="Insert link" onClick={insertLink}><Link2 size={16} /></ToolbarButton>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={sync}
        onBlur={sync}
        className="insight-editor-surface field-textarea rounded-t-none"
        style={{ minHeight: '16rem', borderColor: error ? 'var(--color-danger)' : undefined }}
        suppressContentEditableWarning
        aria-label="Insight content"
      />
      <input type="hidden" name={name} value={html} readOnly />
      {error && <p className="field-error-text">{error}</p>}
      <p className="field-hint">Headings, bold/italic, lists, links and quotes are supported.</p>
    </div>
  )
}
