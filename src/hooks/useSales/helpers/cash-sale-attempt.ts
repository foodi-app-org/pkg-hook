import { formatMinor, minor, moneyNumber } from 'exact-cart-totals'

export type PaymentAttempt = {
  reference: string; storeId: string; actorId: string; sessionId: string; payId: string
  kind: string; amountMinor: string; tenderedMinor: string | null; changeMinor: string | null; pendingOrderId?: string | null
}
export type PendingMarker = PaymentAttempt | { reference: string; legacy: true }
const ZERO = BigInt(0)
export function buildPaymentAttempt(input: {
  reference: string; storeId: string; actorId: string; sessionId: string; payId: string; kind: string
  total: unknown; received: unknown; change: unknown; pendingOrderId?: string | null
}): PaymentAttempt {
  const { reference, storeId, actorId, sessionId, payId, kind } = input
  if (![reference, storeId, actorId, sessionId, payId].every(x => typeof x === 'string' && x.trim())) throw new Error('Contexto de pago incompleto')
  if (!['CASH','CARD','BANK_TRANSFER','DIGITAL_WALLET','OTHER'].includes(kind)) throw new Error('Clasifica el medio de pago')
  const total = minor(input.total)
  moneyNumber(total)
  const cash = kind === 'CASH'
  const received = cash ? minor(total === ZERO && input.received == null ? 0 : input.received) : null
  const change = cash ? minor(input.change) : null
  if (cash) { moneyNumber(received!); moneyNumber(change!) }
  if (cash && (received! - change! !== total || (total === ZERO && received !== ZERO))) throw new Error('Efectivo y vuelto no coinciden')
  if (!cash && minor(input.change ?? 0) !== ZERO) throw new Error('El pago no efectivo no admite vuelto')
  return { reference, storeId, actorId, sessionId, payId, kind, amountMinor: total.toString(), tenderedMinor: received?.toString() ?? null, changeMinor: change?.toString() ?? null, pendingOrderId: input.pendingOrderId ?? null }
}
export function paymentVariables(attempt: PaymentAttempt) {
  return { cashSessionId: attempt.sessionId, paymentInput: {
    methodId: attempt.payId, amountApplied: formatMinor(BigInt(attempt.amountMinor)),
    cashTendered: attempt.tenderedMinor === null ? null : formatMinor(BigInt(attempt.tenderedMinor)),
    expectedChange: attempt.changeMinor === null ? null : formatMinor(BigInt(attempt.changeMinor)),
    idempotencyKey: `payment:${attempt.reference}`, confirmed: true
  }}
}
export function readMarker(raw: string | null, storeId: string): PendingMarker | null {
  if (raw == null) return null
  if (/^T-[A-Za-z0-9-]+$/.test(raw)) return { reference: raw, legacy: true }
  let m: PaymentAttempt
  try { m = JSON.parse(raw) } catch { throw new Error('Existe una referencia de cobro no legible. Requiere revisión administrativa.') }
  if (!m || m.storeId !== storeId || ![m.reference,m.actorId,m.sessionId,m.payId].every(v=>typeof v==='string'&&v.trim()) || !['CASH','CARD','BANK_TRANSFER','DIGITAL_WALLET','OTHER'].includes(m.kind)) throw new Error('Referencia de cobro inválida. Requiere revisión administrativa.')
  const validMinor=(v:unknown)=>typeof v==='string'&&/^\d{1,16}$/.test(v)
  if(!validMinor(m.amountMinor) || (m.kind==='CASH' ? !validMinor(m.tenderedMinor)||!validMinor(m.changeMinor)||BigInt(m.tenderedMinor!)-BigInt(m.changeMinor!)!==BigInt(m.amountMinor) : m.tenderedMinor!==null||m.changeMinor!==null)) throw new Error('Importes pendientes no verificables')
  if (m.pendingOrderId != null && (typeof m.pendingOrderId !== 'string' || m.pendingOrderId.length>200)) throw new Error('Orden pendiente no verificable')
  for (const v of [m.amountMinor,m.tenderedMinor,m.changeMinor]) if (v!==null) moneyNumber(BigInt(v))
  return m
}
export function assertPaymentEvidence(marker: PendingMarker, rows: unknown): void {
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error('No existe un único pago verificable para esta referencia. No registres otra venta.')
  const p = rows[0]
  if (!p || p.status !== 'CONFIRMED' || p.direction !== 'COLLECTION') throw new Error('No existe un cobro confirmado')
  if ('legacy' in marker) throw new Error('El intento anterior no contiene datos suficientes para comprobar que es el mismo cobro. Consulta la venta y solicita revisión administrativa.')
  if (p.sessionId !== marker.sessionId || p.payId !== marker.payId || p.paymentKind !== marker.kind || p.amountAppliedMinor !== marker.amountMinor || p.settlementAmountMinor !== marker.amountMinor || p.roundingDeltaMinor !== '0' || p.cashTenderedMinor !== marker.tenderedMinor || p.cashChangeMinor !== marker.changeMinor) throw new Error('La evidencia no coincide con el intento original. Requiere revisión administrativa.')
}
export function classifySaleResponse(response: any, reference: string, storeId?: string): 'CONFIRMED'|'REJECTED'|'UNKNOWN' {
  const sale = response?.data?.registerSalesStore
  if (sale?.success === true && sale.data?.pCodeRef === reference && (!storeId || sale.data?.idStore === storeId)) return 'CONFIRMED'
  if (sale?.success === false && !response?.errors?.length && !response?.error && !/referencia.*(existe|original)|verifica.*pago original|idempotenc/i.test(String(sale.message??''))) return 'REJECTED'
  return 'UNKNOWN'
}
