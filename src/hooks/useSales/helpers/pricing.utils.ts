import { addCents, moneyCents, multiplyMoneyCents } from './money-minor.utils'

/** Monetary bases for the POS. Courtesy applies only to the principal product. */
export interface PricingLike {
  free?: boolean
  unitPrice?: number | string | null
  ProPrice?: number | string | null
  ProQuantity?: number | string | null
  originalProPrice?: number | string | null
  [key: string]: unknown
}

export const finiteMoney = (value: unknown): number | null => {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'string' && !value.trim()) return null
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}
export const toMoneyCents = (value: unknown): number => moneyCents(value) ?? 0
export const fromMoneyCents = (value: number): number => value / 100
export const isCourtesyProduct = (value: unknown): boolean => value === true || value === 1 || value === '1'

export const resolveBaseLineTotal = (product: PricingLike): number => {
  if (isCourtesyProduct(product.free)) return 0
  const unit = finiteMoney(product.unitPrice)
  const qty = finiteMoney(product.ProQuantity)
  if (unit !== null && qty !== null) return fromMoneyCents(multiplyMoneyCents(product.unitPrice, product.ProQuantity) ?? 0)
  return fromMoneyCents(moneyCents(product.originalProPrice ?? product.ProPrice) ?? 0)
}

/** Extra quantity is its own selected quantity, not the parent quantity. */
export const resolveExtraBaseTotal = (extra: Record<string, unknown>): number => {
  const qty = finiteMoney(extra.quantity)
  if (qty === null || !Number.isInteger(qty) || qty < 1) return 0
  const unit = finiteMoney(extra.extraPrice)
  if (unit !== null) return fromMoneyCents(multiplyMoneyCents(extra.extraPrice, extra.quantity) ?? 0)
  return fromMoneyCents(moneyCents(extra.originalNewExtraPrice ?? extra.newExtraPrice) ?? 0)
}

export const restoreExtraPricing = <T extends Record<string, unknown>>(extra: T) => {
  const { originalNewExtraPrice, discountAmount, discountPercent, ...rest } = extra
  return { ...rest, newExtraPrice: resolveExtraBaseTotal(extra) }
}

export const restoreProductPricing = <T extends PricingLike>(product: T): T => {
  const { originalProPrice, discountAmount, discountPercent, ...rest } = product
  const extras = Array.isArray(product.dataExtra) ? product.dataExtra.map(restoreExtraPricing) : undefined
  return {
    ...rest,
    ProPrice: resolveBaseLineTotal(product),
    ...(extras !== undefined ? { dataExtra: extras } : {})
  } as T
}

/** Validate original sources BEFORE any restoration can overwrite values.
 * A missing original on a discounted legacy row is ambiguous; fail closed.
 * This deliberately does not validate the net, which a pricing mutation rebuilds. */
export function hasPricingSources(products: unknown): boolean {
  if (!Array.isArray(products)) return false
  let total = 0
  for (const p of products) {
    if (!p || typeof p !== 'object' || !Number.isSafeInteger(Number(p.ProQuantity)) || Number(p.ProQuantity) < 1) return false
    const free = isCourtesyProduct(p.free)
    if (p.unitPrice == null && p.originalProPrice == null && (Number(p.discountAmount ?? 0) > 0 || Number(p.discountPercent ?? 0) > 0)) return false
    const base = p.unitPrice != null ? multiplyMoneyCents(p.unitPrice, p.ProQuantity) : moneyCents(p.originalProPrice ?? p.ProPrice)
    if (base === null) return false
    const next = addCents(total, free ? 0 : base)
    if (next === null) return false
    total = next
    if (p.dataExtra != null && !Array.isArray(p.dataExtra)) return false
    for (const e of p.dataExtra ?? []) {
      if (!e || typeof e !== 'object') return false
      const qty = Number(e.quantity ?? 0)
      if (qty === 0) continue
      if (!Number.isSafeInteger(qty) || qty < 1) return false
      if (e.extraPrice == null && e.originalNewExtraPrice == null && (Number(e.discountAmount ?? 0) > 0 || Number(p.discountAmount ?? 0) > 0)) return false
      const amount = e.extraPrice != null ? multiplyMoneyCents(e.extraPrice, qty) : moneyCents(e.originalNewExtraPrice ?? e.newExtraPrice)
      if (amount === null) return false
      const sum = addCents(total, amount)
      if (sum === null) return false
      total = sum
    }
  }
  return true
}
