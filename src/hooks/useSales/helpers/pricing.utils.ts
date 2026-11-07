/**
 * pricing.utils.ts
 *
 * Single source of truth for deriving a cart product's price in the POS.
 *
 * The POS keeps three related figures per product and they MUST stay
 * consistent across add, quantity change, free toggle and discount
 * (apply / edit / remove):
 *
 *   - unitPrice        → catalog unit selling price (stored on the cart item).
 *   - originalProPrice  → the line total BEFORE any global discount. It is only
 *                         present while a discount is applied; it is the value
 *                         to restore to when the discount is removed.
 *   - ProPrice          → the EFFECTIVE line total shown/charged. It is 0 when
 *                         the product is free, the discounted total while a
 *                         discount is active, or the base total otherwise.
 *
 * Business rule: `free` has ABSOLUTE priority. A free product is a courtesy and
 * its effective price is always 0; it is never discountable and never carries a
 * dangling `originalProPrice`.
 */

export interface PricingLike {
  free?: boolean
  unitPrice?: number | string | null
  ProPrice?: number | string | null
  ProQuantity?: number | string | null
  originalProPrice?: number | string | null
  [key: string]: unknown
}

/**
 * Safe numeric coercion. Returns 0 for null/undefined/NaN/negative-less inputs
 * (negatives are clamped to 0 because a line total can never be negative).
 */
const toSafeNumber = (value: unknown): number => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * Resolve the NON-discounted line total for a product, respecting `free`.
 *
 * Priority:
 *   1. free            → 0 (courtesy; absolute priority).
 *   2. unitPrice * qty → the catalog-derived base total when a unit price and a
 *                        quantity are known (the authoritative base).
 *   3. originalProPrice→ the pre-discount total saved by the discount helper.
 *   4. ProPrice        → last-resort fallback (e.g. legacy items without
 *                        unitPrice and without an active discount).
 *
 * This is the base used to compute discounts and the value restored when a
 * discount is removed.
 *
 * @param product - cart product-like object.
 * @returns the non-discounted line total (>= 0).
 */
export const resolveBaseLineTotal = (product: PricingLike): number => {
  if (product?.free === true) return 0

  const unitPrice = Number(product?.unitPrice)
  const quantity = Number(product?.ProQuantity)
  if (Number.isFinite(unitPrice) && unitPrice >= 0 && Number.isFinite(quantity) && quantity > 0) {
    return Math.max(0, unitPrice * quantity)
  }

  if (product?.originalProPrice !== undefined && product?.originalProPrice !== null) {
    return Math.max(0, toSafeNumber(product.originalProPrice))
  }

  return Math.max(0, toSafeNumber(product?.ProPrice))
}

/**
 * Return a NEW product object with its pricing restored to the non-discounted
 * state. Removes the discount footprint (`originalProPrice`, per-item
 * `discountAmount` / `discountPercent`) and resets each extra's
 * `newExtraPrice` from its `originalNewExtraPrice` when present.
 *
 * - A free product is forced to ProPrice 0 and keeps no `originalProPrice`.
 * - A normal product gets ProPrice = resolveBaseLineTotal(product).
 *
 * @param product - cart product-like object.
 * @returns a new product object with clean (non-discounted) pricing.
 */
export const restoreProductPricing = <T extends PricingLike>(product: T): T => {
  const isFree = product?.free === true

  // Restore extras to their pre-discount subtotal (drop the discount footprint).
  const extras = Array.isArray(product?.dataExtra) ? (product.dataExtra as any[]) : undefined
  const restoredExtras = extras?.map((ex) => {
    const hasOriginal = ex?.originalNewExtraPrice !== undefined && ex?.originalNewExtraPrice !== null
    const restoredExtraPrice = hasOriginal
      ? toSafeNumber(ex.originalNewExtraPrice)
      : toSafeNumber(ex?.newExtraPrice)
    const { originalNewExtraPrice, ...restEx } = ex ?? {}
    return {
      ...restEx,
      newExtraPrice: isFree ? 0 : restoredExtraPrice
    }
  })

  const { originalProPrice, discountAmount, discountPercent, ...rest } = product as PricingLike

  const next: any = {
    ...rest,
    ProPrice: isFree ? 0 : resolveBaseLineTotal(product)
  }

  if (restoredExtras) {
    next.dataExtra = restoredExtras
  }

  return next as T
}
