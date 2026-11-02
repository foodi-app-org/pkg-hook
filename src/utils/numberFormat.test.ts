import { numberFormat } from './utils'

describe('numberFormat', () => {
  it('formats a decimal number without corrupting the decimals', () => {
    // Regression: previously stripped the dot and inflated 140618.43 to 14.061.843,00
    expect(numberFormat(140618.43)).toBe('140.618,43')
  })

  it('formats an integer number with two decimals', () => {
    expect(numberFormat(140618)).toBe('140.618,00')
  })

  it('treats a dotted string as thousands separators (es-CO)', () => {
    expect(numberFormat('14.061.843')).toBe('14.061.843,00')
  })

  it('parses an es-CO formatted string (dot thousands, comma decimal)', () => {
    expect(numberFormat('140.618,43')).toBe('140.618,43')
  })

  it('parses a plain decimal string with a dot decimal point', () => {
    expect(numberFormat('140618.43')).toBe('140.618,43')
  })

  it('returns null/undefined unchanged', () => {
    expect(numberFormat(null as unknown as number)).toBeNull()
    expect(numberFormat(undefined as unknown as number)).toBeUndefined()
  })

  it('returns non-numeric strings unchanged', () => {
    expect(numberFormat('abc')).toBe('abc')
  })

  it('handles zero', () => {
    expect(numberFormat(0)).toBe('0,00')
  })
})
