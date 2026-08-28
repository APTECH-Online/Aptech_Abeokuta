const stats = [
  { label: 'Years of technology training', value: '20+' },
  { label: 'Professional programmes', value: '10+' },
  { label: 'Students trained', value: '1,000+' },
  { label: 'Focus', value: 'Career-ready' }
]

// Figures below are illustrative placeholders carried over from the site
// scaffold — replace with verified numbers before launch. Labelled clearly.
export default function StatsBand() {
  return (
    <div className="border-t border-b hairline pattern-adire" style={{ background: 'var(--color-navy-900)' }}>
      <div className="container py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="px-2 sm:px-6 py-2"
              style={{ borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.12)' }}
            >
              <div className="h-display" style={{ color: '#fff', fontSize: 'clamp(1.9rem, 3.4vw, 2.5rem)' }}>{s.value}</div>
              <div className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.58)' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <p className="eyebrow eyebrow-inverse mt-8" style={{ opacity: 0.55 }}>
          Sample figures — replace with verified data before launch
        </p>
      </div>
    </div>
  )
}
