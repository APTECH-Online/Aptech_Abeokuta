import Link from 'next/link'

export default function Pagination({
  page,
  pageSize,
  total,
  basePath,
  searchParams
}: {
  page: number
  pageSize: number
  total: number
  basePath: string
  searchParams: Record<string, string | undefined>
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    params.set('page', String(p))
    return `${basePath}?${params.toString()}`
  }

  return (
    <nav className="flex items-center justify-between mt-4 text-sm" aria-label="Pagination">
      <p style={{ color: 'var(--color-muted)' }}>
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`btn btn-sm btn-secondary ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}
        >
          Previous
        </Link>
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`btn btn-sm btn-secondary ${page >= totalPages ? 'pointer-events-none opacity-40' : ''}`}
        >
          Next
        </Link>
      </div>
    </nav>
  )
}
