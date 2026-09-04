import { courses } from '../../data/courses'

// Every figure here is derived from the site's own verified data (course
// catalogue, partner list) rather than invented — see data/courses.ts and
// components/shared/PartnerLogos.tsx.
const stats = [
  { label: 'Programme areas', value: '3' },
  { label: 'Courses across those areas', value: String(courses.length) },
  { label: 'Academic & accreditation alliances', value: '4' },
  { label: 'Network', value: 'Global Aptech' }
]

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
      </div>
    </div>
  )
}
