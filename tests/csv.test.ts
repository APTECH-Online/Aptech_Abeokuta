import { describe, expect, it } from 'vitest'
import { csvCell, toCsv } from '../lib/csv'

describe('csvCell', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"')
  })
  it('renders null/undefined as empty and numbers as text', () => {
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
    expect(csvCell(42)).toBe('42')
  })
  it('neutralises spreadsheet formula injection', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`)
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)")
    expect(csvCell('-2+3')).toBe("'-2+3")
    expect(csvCell('+1+1')).toBe("'+1+1")
  })
  it('leaves international phone numbers readable', () => {
    expect(csvCell('+234 801 234 5678')).toBe('+234 801 234 5678')
  })
})

describe('toCsv', () => {
  it('writes a BOM, CRLF rows and a trailing newline', () => {
    expect(toCsv([['a', 'b'], ['1', '2']])).toBe('\uFEFFa,b\r\n1,2\r\n')
  })
})
