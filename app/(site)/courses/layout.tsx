import type { ReactNode } from 'react'
import CompareTray from '../../../components/courses/CompareTray'

export default function CoursesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CompareTray />
    </>
  )
}
