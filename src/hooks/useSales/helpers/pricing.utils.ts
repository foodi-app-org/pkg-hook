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
export const toMoneyCents = (value: unknown): number => {
  const n = finiteMoney(value) ?? 0
  return Math.round((n + Number.EPSILON) * 100)
}
export const fromMoneyCents = (value: number): number => value / 100
export const isCourtesyProduct = (value: unknown): boolean => value === true || value === 1 || value === '1'

export const resolveBaseLineTotal = (product: PricingLike): number => {
  if (isCourtesyProduct(product.free)) return 0
  const unit = finiteMoney(product.unitPrice)
  const qty = finiteMoney(product.ProQuantity)
  if (unit !== null && qty !== null) return fromMoneyCents(toMoneyCents(unit * qty))
  return finiteMoney(product.originalProPrice) ?? finiteMoney(product.ProPrice) ?? 0
}

export const resolveExtraBaseTotal = (extra: Record<string, unknown>): number => {
  const qty = finiteMoney(extra.quantity)
  if (qty === null || !Number.isInteger(qty) || qty < 1) return 0
  const unit = finiteMoney(extra.extraPrice)
  if (unit !== null) return fromMoneyCents(toMoneyCents(unit * qty))
  return finiteMoney(extra.originalNewExtraPrice) ?? finiteMoney(extra.newExtraPrice) ?? 0
}

export const restoreExtraPricing = <T extends Record<string, unknown>>(extra: T) => {
  const { ...rest } = extra
  return { ...rest, newExtraPrice: resolveExtraBaseTotal(extra) }
}

export const restoreProductPricing = <T extends PricingLike>(product: T): T => {
  const { ...rest } = product
  const extras = Array.isArray(product.dataExtra) ? product.dataExtra.map(restoreExtraPricing) : undefined
  return {
    ...rest,
    ProPrice: resolveBaseLineTotal(product),
    ...(extras !== undefined ? { dataExtra: extras } : {})
  } as T
}
