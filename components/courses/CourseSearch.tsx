'use client'
import { useMemo, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { categories, Course } from '../../data/courses'
import CourseCard from './CourseCard'

export default function CourseSearch({ initialCourses }: { initialCourses: Course[] }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const counts = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchesQuery = (c: Course) => !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)
    const base = initialCourses.filter(matchesQuery)
    const byCat: Record<string, number> = {}
    for (const c of base) byCat[c.category] = (byCat[c.category] ?? 0) + 1
    return { all: base.length, byCat }
  }, [initialCourses, query])

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
      <div className="course-toolbar">
        <div className="course-search">
          <label htmlFor="course-search" className="sr-only">Search courses</label>
          <Search aria-hidden="true" className="course-search__icon" size={18} />
          <input
            id="course-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape' && query) setQuery('') }}
            placeholder="Search by title, category, or keyword"
            className="course-search__input"
            autoComplete="off"
            enterKeyHint="search"
          />
          {query && (
            <button type="button" className="course-search__clear" onClick={() => { setQuery(''); document.getElementById('course-search')?.focus() }} aria-label="Clear search">
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="course-filters" role="group" aria-label="Filter by category">
          <button
            type="button"
            className="course-filter"
            aria-pressed={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          >
            {activeCategory === null && <Check size={14} strokeWidth={3} aria-hidden="true" />}
            <span>All programmes</span>
            <span className="course-filter__count" aria-label={`${counts.all} programmes`}>{counts.all}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className="course-filter"
              aria-pressed={activeCategory === cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            >
              {activeCategory === cat && <Check size={14} strokeWidth={3} aria-hidden="true" />}
              <span>{cat}</span>
              <span className="course-filter__count" aria-label={`${counts.byCat[cat] ?? 0} programmes`}>{counts.byCat[cat] ?? 0}</span>
            </button>
          ))}
        </div>
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
