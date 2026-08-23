export type Course = {
  slug: string
  title: string
  category: string
  duration: string
  level: string
  description: string
}

export const courses: Course[] = [
  {
    slug: 'software-development-bootcamp',
    title: 'Software Development Bootcamp',
    category: 'Software Development',
    duration: '6 months',
    level: 'Beginner - Intermediate',
    description: 'Full-stack programming fundamentals, web development, and practical projects.'
  },
  {
    slug: 'data-analytics',
    title: 'Data & Analytics',
    category: 'Data & Analytics',
    duration: '4 months',
    level: 'Beginner - Intermediate',
    description: 'Data analysis, databases, reporting, and business intelligence basics.'
  },
  {
    slug: 'digital-skills',
    title: 'Digital Skills',
    category: 'Digital Skills',
    duration: '1-3 months',
    level: 'All levels',
    description: 'Essential computer literacy and productivity tools for the workplace.'
  },
  {
    slug: 'professional-it',
    title: 'Professional IT',
    category: 'Professional IT',
    duration: '3-6 months',
    level: 'Intermediate',
    description: 'Networking, systems, cybersecurity, and infrastructure fundamentals.'
  }
]
