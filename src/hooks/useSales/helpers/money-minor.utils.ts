/** Exact decimal arithmetic for the current two-decimal COP settlement contract.
 * The only quantization is HALF_UP when a monetary result must become cents.
 * No floating-point addition, subtraction, multiplication or percentage allocation.
 */
const TEN = BigInt(10)
const MAX = BigInt(Number.MAX_SAFE_INTEGER)
type Decimal = { coefficient: bigint; scale: number }
function decimal(value: unknown): Decimal | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'number' && (!Number.isFinite(value) || value < 0)) return null
  const raw = String(value).trim()
  const m = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(raw)
  if (!m || raw.length > 100) return null
  const exponent = Number(m[3] ?? 0)
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) return null
  const fraction = m[2] ?? ''
  const scale = fraction.length - exponent
  return { coefficient: BigInt(m[1] + fraction), scale }
}
function quantize(coefficient: bigint, scale: number): bigint {
  if (scale <= 0) return coefficient * TEN ** BigInt(-scale)
  const divisor = TEN ** BigInt(scale)
  const quotient = coefficient / divisor
  return quotient + (coefficient % divisor * BigInt(2) >= divisor ? BigInt(1) : BigInt(0))
}
function safeUnits(units: bigint): number | null {
  if (units < BigInt(0) || units > MAX) return null
  const numeric = Number(units)
  // Public API is still Number/GraphQL Float. Reject a lossy conversion.
  const roundTrip = decimal(numeric / 100)
  if (!roundTrip || quantize(roundTrip.coefficient, roundTrip.scale - 2) !== units) return null
  return numeric
}
export const moneyCents = (value: unknown): number | null => {
  const d = decimal(value)
  return d ? safeUnits(quantize(d.coefficient, d.scale - 2)) : null
}
export const multiplyMoneyCents = (value: unknown, quantity: unknown): number | null => {
  const a = decimal(value), b = decimal(quantity)
  return a && b ? safeUnits(quantize(a.coefficient * b.coefficient, a.scale + b.scale - 2)) : null
}
export const percentMoneyCents = (cents: number, percent: unknown): number | null => {
  const p = decimal(percent)
  if (!p || !Number.isSafeInteger(cents) || cents < 0 || Number(percent) > 100) return null
  return safeUnits(quantize(BigInt(cents) * p.coefficient, p.scale + 2))
}
export const addCents = (a: number, b: number): number | null =>
  Number.isSafeInteger(a) && a >= 0 && Number.isSafeInteger(b) && b >= 0 ? safeUnits(BigInt(a) + BigInt(b)) : null
export const centsToText = (cents: number): string => {
  if (!Number.isSafeInteger(cents) || cents < 0) return ''
  const raw = String(cents).padStart(3, '0')
  return `${raw.slice(0, -2)},${raw.slice(-2)}`
}

/** Sum already monetary values once at the currency boundary. */
export function sumMoneyCents(values: readonly unknown[]): number | null {
  let sum = 0
  for (const value of values) {
    const cents = moneyCents(value)
    if (cents === null) return null
    const next = addCents(sum, cents)
    if (next === null) return null
    sum = next
  }
  return sum
}

/** A settled amount already has at most two significant decimal places.
 * Unlike moneyCents, this never quantizes an inconsistent stored amount. */
export const settledMoneyCents = (value: unknown): number | null => {
  const d = decimal(value)
  if (!d) return null
  const shift = d.scale - 2
  if (shift <= 0) return safeUnits(d.coefficient * TEN ** BigInt(-shift))
  const divisor = TEN ** BigInt(shift)
  return d.coefficient % divisor === BigInt(0) ? safeUnits(d.coefficient / divisor) : null
}
