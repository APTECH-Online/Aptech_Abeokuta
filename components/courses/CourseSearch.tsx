'use client'
import { useState } from 'react'
import { Course } from '../../data/courses'
import CourseCard from './CourseCard'

export default function CourseSearch({ initialCourses }: { initialCourses: Course[] }){
  const [query, setQuery] = useState('')
  const filtered = initialCourses.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase()))

  return (
    <div>
      <div className="flex gap-4">
        <input aria-label="Search courses" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses" className="flex-1 border rounded px-3 py-2" />
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <CourseCard key={c.slug} course={c} />
        ))}
      </div>
    </div>
  )
}
