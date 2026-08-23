'use client'
import { useState } from 'react'

export default function Accordion({ items }: { items: { id: string; title: string; content: string }[] }){
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null)
  return (
    <div className="space-y-2">
      {items.map((it)=> (
        <div key={it.id} className="border rounded">
          <button className="w-full text-left px-4 py-3 flex justify-between" onClick={() => setOpen(open===it.id? null: it.id)}>
            <span>{it.title}</span>
            <span>{open===it.id? '-' : '+'}</span>
          </button>
          {open===it.id && <div className="px-4 pb-4 text-muted">{it.content}</div>}
        </div>
      ))}
    </div>
  )
}
