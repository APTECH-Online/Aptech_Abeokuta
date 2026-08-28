'use client'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { categories, Course } from '../../data/courses'
import CourseCard from './CourseCard'

export default function CourseSearch({ initialCourses }: { initialCourses: Course[] }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return initialCourses.filter((c) => {
      const matchesQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q)
      const matchesCategory = !activeCategory || c.category === activeCategory
      return matchesQuery && matchesCategory
    })
  }, [initialCourses, query, activeCategory])

  return (
    <div>
      <div className="relative max-w-xl">
        <label htmlFor="course-search" className="sr-only">Search courses</label>
        <Search
          aria-hidden="true"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--color-muted)' }}
        />
        <input
          id="course-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, category, or keyword"
          className="field-input"
          style={{ paddingLeft: '2.4rem' }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <button
          type="button"
          className="chip"
          aria-pressed={activeCategory === null}
          onClick={() => setActiveCategory(null)}
        >
          All programmes
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className="chip"
            aria-pressed={activeCategory === cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="mt-5 text-sm" style={{ color: 'var(--color-muted)' }} aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'programme' : 'programmes'} found
      </p>

      {filtered.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <CourseCard key={c.slug} course={c} />
          ))}
        </div>
      ) : (
        <div className="mt-4 card p-10 text-center">
          <p className="font-semibold text-[var(--color-ink)]">No programmes match your search</p>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>
            Try a different keyword or clear the category filter.
          </p>
          <button
            type="button"
            className="btn btn-secondary mt-4"
            onClick={() => { setQuery(''); setActiveCategory(null) }}
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  )
}
