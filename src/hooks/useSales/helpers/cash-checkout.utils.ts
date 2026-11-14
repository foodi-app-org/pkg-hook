export type CashPaymentKind = 'cash' | 'non-cash' | 'unknown'
export interface CashCheckoutInfo {
  kind: CashPaymentKind
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

// Match the existing mutation's whole-COP contract. Do not interpret a raw
// numeric decimal as a thousands-separated string. Invalid values fail closed.
export function parseCop(value: unknown, emptyAsZero = false): number | null {
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    return emptyAsZero ? 0 : null
  }
  let number: number
  if (typeof value === 'number') number = value
  else if (typeof value === 'string') {
    const raw = value.trim()
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(raw)) return null
    number = Number(raw.replace(/\./g, '').replace(',', '.'))
  } else return null
  if (!Number.isFinite(number) || number < 0) return null
  const rounded = Math.round(number)
  return Number.isSafeInteger(rounded) ? rounded : null
}

export function parseCashReceived(raw: string): number | null {
  // Physical cash is entered as whole pesos; allow a correctly grouped paste.
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(raw.trim())) return null
  return parseCop(raw)
}

export function calculateCashCheckout(input: {
  kind: CashPaymentKind
  subtotal: unknown
  delivery: unknown
  receivedText: string
  hasItems: boolean
}): CashCheckoutInfo {
  const subtotal = parseCop(input.subtotal)
  const delivery = parseCop(input.delivery, true)
  const cash = input.kind === 'cash'
  const received = cash ? parseCashReceived(input.receivedText) : null
  const total = (subtotal ?? 0) + (delivery ?? 0)
  const amountsValid = subtotal !== null && delivery !== null && Number.isSafeInteger(total)
  const result: CashCheckoutInfo = {
    kind: input.kind, receivedText: cash && input.hasItems && amountsValid && total > 0 ? input.receivedText : '',
    subtotal: input.hasItems ? (subtotal ?? 0) : 0, delivery: input.hasItems ? (delivery ?? 0) : 0, total: input.hasItems && amountsValid ? total : 0,
    received: cash && input.hasItems && amountsValid && total > 0 ? received : null,
    change: 0, missing: 0, canSubmit: false, message: '', hasItems: input.hasItems, amountsValid
  }
  if (!input.hasItems) result.message = 'Agrega al menos un producto.'
  else if (!amountsValid) result.message = 'Verifica el total y el costo del domicilio.'
  else if (input.kind === 'unknown') result.message = 'Selecciona un método de pago válido.'
  else if (!cash || total === 0) result.canSubmit = true
  else if (received === null) result.message = input.receivedText.trim() ? 'Ingresa un monto válido en pesos enteros.' : 'Ingresa el efectivo recibido.'
  else if (received < total) {
    result.missing = total - received
    result.message = 'El efectivo recibido es insuficiente.'
  } else if (received - total > 2147483647) {
    result.message = 'El vuelto supera el límite permitido.'
  } else {
    result.change = received - total
    result.canSubmit = true
  }
  return result
}
