import Link from 'next/link'
import Container from '../../components/ui/Container'

export default function NotFound() {
  return (
    <section className="section">
      <Container className="max-w-xl text-center">
        <div className="console-card text-left mx-auto max-w-sm">
          <div className="console-card__bar">
            <span className="console-card__dot" />
            <span className="console-card__dot" />
            <span className="console-card__dot" />
            <span className="console-card__title">route.log</span>
          </div>
          <div className="console-card__body">
            <p className="console-line" style={{ color: '#f87171' }}>404 — route not found</p>
            <p className="console-line console-key mt-1">the page you requested does not exist</p>
          </div>
        </div>
        <h1 className="h-section mt-8">We couldn't find that page</h1>
        <p className="lede mt-3">
          The page may have moved or the link may be out of date. Try the homepage, or jump
          straight to the course catalogue.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">Go to homepage</Link>
          <Link href="/courses" className="btn btn-secondary">Browse courses</Link>
        </div>
      </Container>
    </section>
  )
}
