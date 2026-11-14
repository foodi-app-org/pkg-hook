/** POS policy: only a recognized cash method may carry physical change. */
export type PaymentKind = 'cash' | 'non-cash' | 'unknown'

export const normalizePaymentName = (name: unknown): string =>
  typeof name === 'string'
    ? name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ')
    : ''

const CASH_NAMES = new Set(['efectivo', 'cash', 'pago en efectivo', 'dinero en efectivo'])

export const resolvePaymentKind = (name: unknown): PaymentKind => {
  const normalized = normalizePaymentName(name)
  if (!normalized) return 'unknown'
  return CASH_NAMES.has(normalized) ? 'cash' : 'non-cash'
}

type CatalogMethod = { payId?: string | null; name?: string | null }
export const resolveSelectedPaymentKind = (
  methods: readonly CatalogMethod[] | null | undefined,
  payId: string | null | undefined
): PaymentKind => {
  if (!payId) return 'unknown'
  return resolvePaymentKind(methods?.find(method => method.payId === payId)?.name)
}

export const clearNonCashChange = <T extends { change?: unknown }>(values: T, kind: PaymentKind): T =>
  kind === 'non-cash' && values.change !== ''
    ? { ...values, change: '' }
    : values

export const paymentChangeForMutation = <T>(
  kind: PaymentKind,
  change: T,
  convert: (value: T) => number
): number => kind === 'cash' ? convert(change) : 0

export const hasUnresolvedChange = (kind: PaymentKind, change: unknown): boolean => {
  if (kind !== 'unknown' || change == null || change === 0) return false
  if (typeof change === 'string' && /^(?:0+(?:[.,]0+)?)?$/.test(change.trim())) return false
  return true
}

export const dispatchWithPaymentChange = <T extends { type: string; payload?: unknown }>(
  action: T,
  methods: readonly CatalogMethod[] | null | undefined,
  clearChange: () => void,
  dispatch: (action: T) => void
): void => {
  if (action.type === 'PAYMENT_METHOD' && typeof action.payload === 'string' &&
      resolveSelectedPaymentKind(methods, action.payload) === 'non-cash') {
    clearChange()
  }
  dispatch(action)
}
