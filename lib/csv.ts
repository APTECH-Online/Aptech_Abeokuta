/**
 * Small CSV writer for CRM exports.
 *
 * Cells that start with = + - @ (or a tab/CR) are prefixed with an apostrophe so a
 * spreadsheet never evaluates attacker-controlled text as a formula (CSV
 * injection). Plain international phone numbers such as +2348012345678 are left
 * alone: they cannot form a formula.
 */
const FORMULA_START = /^[=+\-@\t\r]/
const PHONE_LIKE = /^\+[0-9][0-9 ()-]*$/

export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value)
  if (FORMULA_START.test(text) && !PHONE_LIKE.test(text)) text = `'${text}`
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`
  return text
}

export function toCsv(rows: unknown[][]): string {
  // A BOM makes Excel open the file as UTF-8 (names with accents stay intact).
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
