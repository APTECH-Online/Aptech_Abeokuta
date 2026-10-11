/** Seat maths shared by the public events page and its tests. */
export function availability(capacity: number | null | undefined, registered: number): { spots_left: number | null; is_full: boolean } {
  if (!capacity || capacity <= 0) return { spots_left: null, is_full: false }
  const left = Math.max(capacity - Math.max(registered, 0), 0)
  return { spots_left: left, is_full: left === 0 }
}
