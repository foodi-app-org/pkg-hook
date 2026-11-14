import { fromMoneyCents, isCourtesyProduct, resolveBaseLineTotal, resolveExtraBaseTotal, restoreProductPricing, toMoneyCents } from './pricing.utils'

export enum TypeDiscount { PERCENT = 'PERCENT', AMOUNT = 'AMOUNT' }
interface DiscountPayload { type: TypeDiscount; value: number }
type Notify = (notification: { title: string; backgroundColor: 'success' | 'error' | 'warning' | 'info'; description: string }) => void

/** Allocate integer cents, preserving the total and stable order on ties. */
export function allocateCents(bases: number[], requested: number): number[] {
  const total = bases.reduce((s, n) => s + n, 0)
  if (!total || requested <= 0) return bases.map(() => 0)
  const target = Math.min(total, requested)
  // BigInt keeps proportional allocation exact even for large COP values.
  const divisor = BigInt(total)
  const numerators = bases.map(base => BigInt(base) * BigInt(target))
  const allocations = numerators.map(n => Number(n / divisor))
  let remainder = target - allocations.reduce((s, n) => s + n, 0)
  const order = numerators.map((n, i) => ({ i, rem: n % divisor })).sort((a, b) => a.rem === b.rem ? a.i - b.i : a.rem > b.rem ? -1 : 1)
  for (const { i } of order) {
    if (remainder === 0) break
    if (allocations[i] < bases[i]) { allocations[i]++; remainder-- }
  }
  return allocations
}

/** Same discountable base used by the allocator and by the POS UI. */
const buildDiscountLines = (state: { PRODUCT?: unknown } | null | undefined) => {
  const products: any[] = Array.isArray(state?.PRODUCT) ? state.PRODUCT : []
  const lines = products.map(product => {
    const free = isCourtesyProduct(product.free)
    const base = toMoneyCents(resolveBaseLineTotal(product))
    const extras: any[] = Array.isArray(product.dataExtra) ? product.dataExtra : []
    const prices = extras.map(ex => toMoneyCents(resolveExtraBaseTotal(ex)))
    const discountable = free ? 0 : base + prices.reduce((sum, p) => sum + p, 0)
    return { product, free, base, extras, prices, discountable }
  })
  return lines
}

export const getDiscountableSubtotal = (state: { PRODUCT?: unknown } | null | undefined): number => {
  const gross = buildDiscountLines(state).reduce((sum, line) => sum + line.discountable, 0)
  return Number.isSafeInteger(gross) && gross > 0 ? fromMoneyCents(gross) : 0
}

/** Preserve the existing global-discount scope: courtesy parents are excluded;
 * their selected extras are charged at full price, NOT gifted or discounted.
 * For paid parents, keep the original base-first, then extras allocation rule.
 */
export const applyDiscountToCart = (state: any, payload: DiscountPayload, sendNotification?: Notify) => {
  const type = String(payload?.type ?? TypeDiscount.PERCENT).toUpperCase()
  const value = Number(payload?.value)
  if (![TypeDiscount.PERCENT, TypeDiscount.AMOUNT].includes(type as TypeDiscount) || !Number.isFinite(value) || value < 0 || (type === TypeDiscount.PERCENT && value > 100)) {
    sendNotification?.({ title: 'Error', backgroundColor: 'warning', description: 'Descuento no válido.' })
    return state
  }
  const lines = buildDiscountLines(state)
  const gross = lines.reduce((sum, line) => sum + line.discountable, 0)
  if (!Number.isSafeInteger(gross)) {
    sendNotification?.({ title: 'Error', backgroundColor: 'error', description: 'El importe supera el rango seguro de cálculo.' })
    return state
  }
  const requested = type === TypeDiscount.PERCENT ? Math.round(gross * value / 100) : toMoneyCents(value)
  const applied = Math.min(gross, requested)
  const allocations = allocateCents(lines.map(line => line.discountable), applied)
  const breakdown: { pId: string | number; discountAmount: number }[] = []
  const nextProducts = lines.map((line, i) => {
    const allocated = allocations[i]
    const restored = restoreProductPricing(line.product)
    if (line.free || applied === 0) {
      breakdown.push({ pId: line.product.pId, discountAmount: 0 })
      return { ...restored, ...(line.free ? { free: true, ProPrice: 0, discountAmount: 0, discountPercent: 0 } : {}) }
    }
    const onBase = Math.min(line.base, allocated)
    const extraAlloc = allocateCents(line.prices, allocated - onBase)
    const extras = line.extras.map((ex, j) => ({
      ...restored.dataExtra[j],
      originalNewExtraPrice: fromMoneyCents(line.prices[j]),
      newExtraPrice: fromMoneyCents(line.prices[j] - extraAlloc[j]),
      // Product-level discountAmount still contains base + extras, per legacy API.
      // The extra price itself is authoritative; avoid new GraphQL input fields.
    }))
    breakdown.push({ pId: line.product.pId, discountAmount: fromMoneyCents(allocated) })
    return {
      ...restored,
      originalProPrice: fromMoneyCents(line.base),
      ProPrice: fromMoneyCents(line.base - onBase),
      ...(Array.isArray(line.product.dataExtra) ? { dataExtra: extras } : {}),
      discountAmount: fromMoneyCents(allocated),
      discountPercent: line.discountable > 0 ? Number((allocated / line.discountable * 100).toFixed(4)) : 0
    }
  })
  if (applied > 0) {
    sendNotification?.({ title: 'Descuento aplicado', backgroundColor: 'success', description: 'Se actualizó el total de la venta.' })
  } else if (value > 0) {
    sendNotification?.({ title: 'Descuento no aplicado', backgroundColor: 'warning', description: gross === 0 ? 'No hay productos con importe descontable.' : 'El descuento equivale a cero con la precisión monetaria actual.' })
  } else {
    sendNotification?.({ title: 'Descuento eliminado', backgroundColor: 'info', description: 'Se restauraron los precios de venta.' })
  }
  return { ...state, PRODUCT: nextProducts, discountType: applied > 0 ? type : TypeDiscount.PERCENT, discountPercent: applied > 0 && type === TypeDiscount.PERCENT ? value : 0, discountAmount: fromMoneyCents(applied), discountBreakdown: applied ? breakdown : [] }
}

/** Repairs old cart / pending-order data only for courtesy lines when no discount is active. */
export const reapplyActiveDiscount = (state: any): any => {
  const type = state?.discountType === TypeDiscount.AMOUNT ? TypeDiscount.AMOUNT : TypeDiscount.PERCENT
  const value = Number(type === TypeDiscount.AMOUNT ? state?.discountAmount : state?.discountPercent)
  if (Number.isFinite(value) && value > 0) return applyDiscountToCart(state, { type, value })
  let changed = false
  const products = Array.isArray(state?.PRODUCT) ? state.PRODUCT.map((p: any) => {
    if (!isCourtesyProduct(p.free)) return p
    const restored = restoreProductPricing(p)
    if (p.ProPrice !== 0 || (Array.isArray(p.dataExtra) && p.dataExtra.some((ex: any, i: number) => ex.newExtraPrice !== restored.dataExtra[i].newExtraPrice || ex.originalNewExtraPrice != null))) { changed = true; return restored }
    return p
  }) : []
  return changed ? { ...state, PRODUCT: products } : state
}

/** Clear stale discount metadata when the last eligible line disappears.
 * Do not clear a valid 100% discount: its pre-discount base is still positive.
 * All other cart changes retain their existing pricing behavior.
 */
export const reconcileUnavailableDiscount = <T extends { PRODUCT?: unknown; discountPercent?: number; discountAmount?: number }>(state: T): T => {
  const percent = Number(state.discountPercent ?? 0)
  const amount = Number(state.discountAmount ?? 0)
  if (percent <= 0 && amount <= 0) return state
  if (getDiscountableSubtotal(state) > 0 && amount > 0) return state
  return applyDiscountToCart(state, { type: TypeDiscount.PERCENT, value: 0 }) as T
}
