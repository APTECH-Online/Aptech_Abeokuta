export function toMetricNumber(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
}

export function formatMetricNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('en-NG', {
    maximumFractionDigits: 0,
    useGrouping: true
  }).format(toMetricNumber(value))
}
