import { minor, moneyNumber, formatMinor } from 'exact-cart-totals'
import { moneyCents } from './money-minor.utils'

export type CashReceivedMode = 'manual' | 'exact'
export type CashPaymentKind = 'cash' | 'non-cash' | 'unknown'

export interface CashCheckoutInfo {
  kind: CashPaymentKind
  receivedMode: CashReceivedMode
  receivedText: string
  subtotal: number
  delivery: number
  total: number
  received: number | null
  change: number
  missing: number
  canSubmit: boolean
  message: string
  hasItems: boolean
  amountsValid: boolean
}

const MONEY_SCALE = 100
// Preserve the previous business limit on change, independently of GraphQL Float.
const MAX_CHANGE_CENTS = 2147483647 * MONEY_SCALE
const LOCAL_MONEY = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/
const CASH_MONEY = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/

/** Parse numeric money or es-CO text. Round to cents, not whole pesos. */
function parseCopCents(value: unknown, emptyAsZero = false, strict = false): number | null {
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    return emptyAsZero ? 0 : null
  }
  let number: number
  if (typeof value === 'number') number = value
  else if (typeof value === 'string') {
    const raw = value.trim()
    if (!LOCAL_MONEY.test(raw)) return null
    number = Number(raw.replace(/\./g, '').replace(',', '.'))
  } else return null
  if (!Number.isFinite(number) || number < 0) return null
  const normalized = typeof value === 'string' ? value.trim().replace(/\./g, '').replace(',', '.') : number
  if (!strict) return moneyCents(normalized)
  try { const units = minor(normalized); moneyNumber(units); return Number(units) } catch { return null }
}

/** Public API continues to return COP (not cents). */
export function parseCop(value: unknown, emptyAsZero = false): number | null {
  const cents = parseCopCents(value, emptyAsZero)
  return cents === null ? null : cents / MONEY_SCALE
}

function parseCashReceivedCents(raw: string): number | null {
  if (typeof raw !== 'string' || !CASH_MONEY.test(raw.trim())) return null
  return parseCopCents(raw, false, true)
}

export function parseCashReceived(raw: string): number | null {
  const cents = parseCashReceivedCents(raw)
  return cents === null ? null : cents / MONEY_SCALE
}

export function calculateCashCheckout(input: {
  kind: CashPaymentKind
  subtotal: unknown
  delivery: unknown
  receivedText: string
  hasItems: boolean
  receivedMode?: CashReceivedMode
  integrityMessage?: string
  blockingMessage?: string
}): CashCheckoutInfo {
  const subtotal = parseCopCents(input.subtotal, false, true)
  const delivery = parseCopCents(input.delivery, true, true)
  const cash = input.kind === 'cash'
  let totalCents: number | null = null
  if (subtotal !== null && delivery !== null) {
    try { const units = BigInt(subtotal) + BigInt(delivery); moneyNumber(units); totalCents = Number(units) } catch { /* fail closed */ }
  }
  const total = totalCents ?? 0
  const amountsValid = totalCents !== null && !input.integrityMessage
  const showCash = cash && input.hasItems && amountsValid && total > 0
  const receivedMode = cash && input.receivedMode === 'exact' ? 'exact' : 'manual'
  const receivedText = showCash && receivedMode === 'exact' ? formatMinor(BigInt(total)).replace('.', ',') : input.receivedText
  const received = showCash ? parseCashReceivedCents(receivedText) : null
  const result: CashCheckoutInfo = {
    kind: input.kind,
    receivedMode,
    receivedText: showCash ? receivedText : '',
    subtotal: input.hasItems ? moneyNumber(BigInt(subtotal ?? 0)) : 0,
    delivery: input.hasItems ? moneyNumber(BigInt(delivery ?? 0)) : 0,
    total: input.hasItems && amountsValid ? moneyNumber(BigInt(total)) : 0,
    received: showCash && received !== null ? moneyNumber(BigInt(received)) : null,
    change: 0,
    missing: 0,
    canSubmit: false,
    message: '',
    hasItems: input.hasItems,
    amountsValid
  }
  if (!input.hasItems) result.message = 'Agrega al menos un producto.'
  else if (!amountsValid) result.message = input.integrityMessage || 'Verifica el total y el costo del domicilio (máximo dos decimales).'
  else if (input.kind === 'unknown') result.message = 'Selecciona un método de pago válido.'
  else if (!cash || total === 0) result.canSubmit = true
  else if (received === null) result.message = receivedText.trim()
    ? 'Ingresa un monto válido con máximo dos decimales.'
    : 'Ingresa el efectivo recibido.'
  else if (received < total) {
    try { result.missing = moneyNumber(BigInt(total - received)); result.message = 'El efectivo recibido es insuficiente.' } catch { result.message = 'Importe fuera del rango exacto permitido.' }
  } else if (received - total > MAX_CHANGE_CENTS) {
    result.message = 'El vuelto supera el límite permitido.'
  } else {
    try { result.change = moneyNumber(BigInt(received - total)); result.canSubmit = true } catch { result.message = 'El vuelto no se puede representar exactamente.' }
  }
  if (input.blockingMessage && input.hasItems && amountsValid) {
    result.canSubmit = false
    result.message = input.blockingMessage
  }
  return result
}
