// Line-icon set for the ADSE term/curriculum cards. Drawn in the same
// geometric, single-weight style as CourseIcon so photography/logos are
// replaced with the site's own "adire circuit" icon language.
export type AdseTermKey =
  | 'foundations'
  | 'markup-java'
  | 'java'
  | 'dotnet'
  | 'oracle'
  | 'network'
  | 'data-science'
  | 'ai-ml'
  | 'iot'
  | 'careers'
  | 'globe'
  | 'africa'

export default function AdseTermIcon({
  term,
  className = 'w-9 h-9'
}: {
  term: AdseTermKey
  className?: string
}) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  }

  switch (term) {
    // Term 1 — Programming principles, OOP, web & database foundations
    case 'foundations':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M8.5 8 4.5 12l4 4" />
          <path d="M15.5 8l4 4-4 4" />
          <circle cx="12" cy="4.5" r="1" fill="currentColor" stroke="none" />
          <path d="M4.5 19.5h5M14.5 19.5h5" />
        </svg>
      )
    // Term 2 — Markup/JSON, OS, Java & OOP
    case 'markup-java':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M7 4.5 3.5 12 7 19.5" />
          <path d="M17 4.5 20.5 12 17 19.5" />
          <path d="M9.5 9.5c.9-1 2.1-1 3 0 .9 1 .9 2 0 3-1.1 1.1-1.1 2 0 3" />
        </svg>
      )
    // Java-based application tracks (Term 3a, 4a) — cup-and-steam mark, abstracted
    case 'java':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M8 13.5c-1.4 1-1.4 3 1 3.6 3 .8 6.7.4 8-1" />
          <rect x="6" y="10" width="11" height="4.5" rx="1.4" />
          <path d="M17 11h1.5a2 2 0 0 1 0 4H17" />
          <path d="M9.5 4.5c-1 1.2-1 2 0 3.2M13 4.5c-1 1.2-1 2 0 3.2" />
        </svg>
      )
    // .NET tracks (Term 3b, 4b) — abstract layered-stack mark
    case 'dotnet':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 8.5 12 4.5l8 4v7l-8 4-8-4z" />
          <path d="M4 8.5 12 12.5l8-4" />
          <path d="M12 12.5v7" />
        </svg>
      )
    // Oracle / relational database track (Term 4c) — cylinder mark
    case 'oracle':
      return (
        <svg {...common} aria-hidden="true">
          <ellipse cx="12" cy="6" rx="7" ry="2.6" />
          <path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6" />
          <path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
        </svg>
      )
    // Networking specialisation (Term 4d) — node/graph mark
    case 'network':
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="5.5" cy="17" r="1.8" />
          <circle cx="18.5" cy="17" r="1.8" />
          <path d="M12 6.8 6.6 15.6M12 6.8l5.4 8.8M7.3 17h9.4" />
        </svg>
      )
    // Data science specialisation (Term 4e)
    case 'data-science':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4.5 19.5h15" />
          <rect x="5.5" y="13" width="3" height="6.5" rx="0.6" />
          <rect x="10.5" y="7.5" width="3" height="12" rx="0.6" />
          <rect x="15.5" y="10.5" width="3" height="9" rx="0.6" />
          <path d="M6 11.5 10.5 6l5 3.5 3-3" />
        </svg>
      )
    // AI & machine learning (Term 4f)
    case 'ai-ml':
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="3.4" />
          <path d="M12 4.5v2.3M12 17.2v2.3M4.5 12h2.3M17.2 12h2.3M6.9 6.9l1.6 1.6M15.5 15.5l1.6 1.6M17.1 6.9l-1.6 1.6M8.5 15.5l-1.6 1.6" />
        </svg>
      )
    // Internet of Things (Term 4g)
    case 'iot':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="8" y="8" width="8" height="8" rx="1.2" />
          <circle cx="12" cy="12" r="1.6" />
          <path d="M12 3.5V6M12 18v2.5M3.5 12H6M18 12h2.5M6.2 6.2 7.8 7.8M16.2 16.2l1.6 1.6M17.8 6.2 16.2 7.8M7.8 16.2 6.2 17.8" />
        </svg>
      )
    // Industry & careers / exit profiles
    case 'careers':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="8" width="16" height="11" rx="1.4" />
          <path d="M9 8V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v2" />
          <path d="M4 13h16M10.8 13v1.6h2.4V13" />
        </svg>
      )
    // Global industry scenario
    case 'globe':
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12h16M12 4c2.4 2.2 3.6 5 3.6 8s-1.2 5.8-3.6 8c-2.4-2.2-3.6-5-3.6-8s1.2-5.8 3.6-8Z" />
        </svg>
      )
    // Africa industry scenario — abstracted geometric continent mark
    case 'africa':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M11 3.5 15 6l-1 3 2.5 2.5-1 4L18 19l-3 2-3-3-3 1-2.5-3 1-3.5-2-3.5 2-3Z" />
          <circle cx="12" cy="10.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    default:
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="1.4" />
        </svg>
      )
  }
}
