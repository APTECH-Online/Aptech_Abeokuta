// A vector roadmap of the four-term ADSE pathway, drawn in the site's own
// "adire circuit" visual language (diamond node-marks, fine trace lines,
// mono labels) instead of a curriculum photo/screenshot.
export default function AdseRoadmap({ className = 'w-full h-auto block' }: { className?: string }) {
  const nodes = [
    { x: 60, cx: 60 },
    { x: 220, cx: 220 },
    { x: 380, cx: 380 },
    { x: 540, cx: 540 }
  ]

  return (
    <svg
      viewBox="0 0 600 340"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Four-term Advanced Diploma in Software Engineering roadmap"
    >
      <rect x="0" y="0" width="600" height="340" fill="#1D1250" />

      {/* fine trace grid, matching .pattern-adire */}
      <defs>
        <pattern id="adseGrid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0V28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        </pattern>
        <radialGradient id="adseGlow" cx="70%" cy="18%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="600" height="340" fill="url(#adseGrid)" />
      <rect x="0" y="0" width="600" height="340" fill="url(#adseGlow)" />

      {/* connecting spine */}
      <line x1="60" y1="170" x2="540" y2="170" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
      <line x1="60" y1="170" x2="540" y2="170" stroke="#E2A33D" strokeWidth="1.5" strokeDasharray="2 7" opacity="0.6" />

      {nodes.map((n, i) => (
        <g key={n.x}>
          {/* diamond node-mark */}
          <rect
            x={n.x - 6}
            y="164"
            width="12"
            height="12"
            fill={i === nodes.length - 1 ? '#E2A33D' : '#1CB081'}
            transform={`rotate(45 ${n.x} 170)`}
          />
          <circle cx={n.x} cy="170" r="15" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

          {/* label */}
          <text
            x={n.x}
            y="130"
            textAnchor="middle"
            fontFamily="var(--font-mono, monospace)"
            fontSize="11"
            letterSpacing="1"
            fill="#EFC077"
          >
            {`TERM ${i + 1}`}
          </text>
          <text
            x={n.x}
            y="210"
            textAnchor="middle"
            fontFamily="var(--font-sans, sans-serif)"
            fontSize="12"
            fontWeight={600}
            fill="#F5F2FC"
          >
            {['Foundations', 'Java & OOP', 'App Dev', 'Specialise'][i]}
          </text>
          <text
            x={n.x}
            y="228"
            textAnchor="middle"
            fontFamily="var(--font-sans, sans-serif)"
            fontSize="10"
            fill="rgba(255,255,255,0.55)"
          >
            {['Programming & web', 'Markup, OS & Java', 'APIs & databases', 'AI · IoT · Data · Careers'][i]}
          </text>
        </g>
      ))}

      {/* corner mark echoing the eyebrow "::" motif */}
      <rect x="60" y="264" width="9" height="9" fill="none" stroke="#E2A33D" strokeWidth="1.5" transform="rotate(45 64.5 268.5)" />
      <text x="80" y="272" fontFamily="var(--font-mono, monospace)" fontSize="10.5" letterSpacing="1.5" fill="rgba(255,255,255,0.5)">
        ADSE // FOUR-TERM PATHWAY
      </text>
    </svg>
  )
}
