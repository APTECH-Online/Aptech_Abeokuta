'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import Container from '../../components/ui/Container'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log to your error reporting service here.
    console.error(error)
  }, [error])

  return (
    <section className="section">
      <Container className="max-w-xl text-center">
        <div className="console-card text-left mx-auto max-w-sm">
          <div className="console-card__bar">
            <span className="console-card__dot" />
            <span className="console-card__dot" />
            <span className="console-card__dot" />
            <span className="console-card__title">error.log</span>
          </div>
          <div className="console-card__body">
            <p className="console-line" style={{ color: '#f87171' }}>500 — something went wrong</p>
            <p className="console-line console-key mt-1">an unexpected error occurred while loading this page</p>
          </div>
        </div>
        <h1 className="h-section mt-8">Something went wrong</h1>
        <p className="lede mt-3">
          This is unexpected on our end, not something you did. Try again, or head back to the homepage.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => reset()} className="btn btn-primary">Try again</button>
          <Link href="/" className="btn btn-secondary">Go to homepage</Link>
        </div>
      </Container>
    </section>
  )
}
