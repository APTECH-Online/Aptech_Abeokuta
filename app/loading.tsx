export default function Loading() {
  return (
    <div className="container py-16" role="status" aria-live="polite">
      <span className="sr-only">Loading page content…</span>
      <div className="skeleton h-8 w-64 mb-6" />
      <div className="skeleton h-4 w-full max-w-xl mb-3" />
      <div className="skeleton h-4 w-full max-w-lg mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-11 w-11 mb-4" style={{ borderRadius: '10px' }} />
            <div className="skeleton h-4 w-3/4 mb-2" />
            <div className="skeleton h-3 w-full mb-1.5" />
            <div className="skeleton h-3 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  )
}
