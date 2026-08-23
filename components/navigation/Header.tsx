'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'

export default function Header(){
  const [open, setOpen] = useState(false)
  const [sticky, setSticky] = useState(false)

  useEffect(()=>{
    const onScroll = ()=> setSticky(window.scrollY>50)
    window.addEventListener('scroll', onScroll)
    return ()=> window.removeEventListener('scroll', onScroll)
  },[])

  return (
    <header className={`${sticky? 'shadow-sm bg-white': 'bg-transparent'} sticky top-0 z-40 transition`}> 
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold">APTECH <span className="hidden sm:inline">Abeokuta</span></Link>
        </div>

        <nav className="hidden md:flex items-center gap-6" aria-label="Primary">
          <Link href="/" className="focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] rounded">Home</Link>
          <Link href="/about" className="focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] rounded">About</Link>
          <Link href="/courses" className="focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] rounded">Courses</Link>
          <Link href="/about#why" className="focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] rounded">Why APTECH</Link>
          <Link href="/admissions" className="focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] rounded">Admissions</Link>
          <Link href="/contact" className="focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] rounded">Contact</Link>
          <Link href="/admissions" className="bg-[var(--color-secondary)] text-white px-3 py-2 rounded shadow-sm hover:shadow-md transition">Enroll Now</Link>
        </nav>

        <div className="md:hidden">
          <button aria-label="menu" aria-expanded={open} onClick={()=>setOpen(!open)} className="p-2 focus:ring-2 focus:ring-[var(--color-secondary)] rounded">
            <Menu />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t">
          <div className="container py-4 flex flex-col gap-3">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/courses">Courses</Link>
            <Link href="/admissions">Admissions</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/admissions" className="inline-block bg-[var(--color-secondary)] text-white px-3 py-2 rounded">Enroll Now</Link>
          </div>
        </div>
      )}
    </header>
  )
}
