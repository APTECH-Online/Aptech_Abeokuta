import { ReactElement } from 'react'

// Small, consistent line-icon set per course category (and, for Short Term
// Courses, per individual course). Original geometric marks (not
// photography/stock icons) so they stay licence-free and match the site's
// console/technology motif.

const shortCourseIcons: Record<string, ReactElement> = {
  'ms-office-2019-office-automation': (
    <>
      <rect x="4.5" y="3.5" width="12" height="17" rx="1.4" />
      <path d="M8 8h5M8 11.5h5M8 15h3.5" />
      <path d="M16.5 8.5l3 1.4v6.2l-3 1.4" />
    </>
  ),
  'responsive-web-development': (
    <>
      <path d="M8.5 8 4.5 12l4 4" />
      <path d="M15.5 8l4 4-4 4" />
      <path d="M13 6.5l-2 11" />
    </>
  ),
  'advanced-excel-2019': (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="1.4" />
      <path d="M3.5 9.5h17M9 9.5V20" />
      <path d="M5.7 12.8l2.6 3.4M8.3 12.8l-2.6 3.4" />
    </>
  ),
  'graphics-design': (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 0 0 16c1.1 0 2-.7 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1.1.9-1.8 2-1.8h1.3A3.7 3.7 0 0 0 20 8.9C18.4 6 15.4 4 12 4Z" />
      <circle cx="8.2" cy="11.2" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="10.6" cy="8" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="8.4" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  linux: (
    <>
      <ellipse cx="12" cy="9" rx="3.2" ry="4" />
      <path d="M9.2 12c-1 1.6-1.7 3.3-1.7 4.8 0 1.5 1 2.7 2.2 1.9.7-.4 1.4-.6 2.3-.6s1.6.2 2.3.6c1.2.8 2.2-.4 2.2-1.9 0-1.5-.7-3.2-1.7-4.8" />
      <circle cx="10.6" cy="8.2" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="13.4" cy="8.2" r="0.5" fill="currentColor" stroke="none" />
    </>
  ),
  'python-django': (
    <>
      <path d="M9.5 4.5h3.2c1 0 1.8.8 1.8 1.8v2.4H9.7c-1.4 0-2.5 1.1-2.5 2.5v1.6H5.3c-1 0-1.8-.8-1.8-1.8V8.7c0-1 .8-1.8 1.8-1.8h1.1" />
      <path d="M14.5 19.5h-3.2c-1 0-1.8-.8-1.8-1.8v-2.4h4.8c1.4 0 2.5-1.1 2.5-2.5v-1.6h1.9c1 0 1.8.8 1.8 1.8v2.3c0 1-.8 1.8-1.8 1.8h-1.1" />
      <circle cx="8.6" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="17.2" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  'java-i-ii': (
    <>
      <path d="M8 12.5h7a2.5 2.5 0 0 1 0 5H8.5A2.5 2.5 0 0 1 6 15V9" />
      <path d="M16.5 13.2c1.6.3 2.5 1 2.5 1.8 0 1.2-2 2-4.5 2" />
      <path d="M9.5 4.5c-.8.8-.8 1.4 0 2.2M12.2 4.5c-.8.8-.8 1.4 0 2.2" />
    </>
  ),
  'windows-server-admin': (
    <>
      <rect x="4" y="4" width="16" height="6" rx="1.4" />
      <rect x="4" y="14" width="16" height="6" rx="1.4" />
      <circle cx="7.5" cy="7" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="7.5" cy="17" r="0.6" fill="currentColor" stroke="none" />
      <path d="M11.5 7h5M11.5 17h5" />
    </>
  ),
  'data-mgt-sql-server-2016': (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.5" />
      <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
      <path d="M5 11c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
    </>
  )
}

export default function CourseIcon({
  category,
  slug,
  className = 'w-6 h-6'
}: {
  category: string
  slug?: string
  className?: string
}) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  }

  if (slug && shortCourseIcons[slug]) {
    return (
      <svg {...common} aria-hidden="true">
        {shortCourseIcons[slug]}
      </svg>
    )
  }

  switch (category) {
    case 'Advanced Diploma':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M8.5 8 4.5 12l4 4" />
          <path d="M15.5 8l4 4-4 4" />
          <path d="M13 6.5l-2 11" />
        </svg>
      )
    case 'Smart Pro':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 19V10" />
          <path d="M10 19V5" />
          <path d="M16 19v-7" />
          <path d="M20 19H4" />
        </svg>
      )
    case 'Aptech Certified Network Specialist':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="11" rx="1.6" />
          <path d="M8.5 20h7" />
          <path d="M12 16v4" />
        </svg>
      )
    case 'Short Term Courses':
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      )
    default:
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="4" width="16" height="6" rx="1.4" />
          <rect x="4" y="14" width="16" height="6" rx="1.4" />
          <circle cx="7.5" cy="7" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="7.5" cy="17" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      )
  }
}
