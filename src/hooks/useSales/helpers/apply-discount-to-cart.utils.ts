import { resolveBaseLineTotal, restoreProductPricing } from './pricing.utils'

export enum TypeDiscount {
  PERCENT = 'PERCENT',
  AMOUNT = 'AMOUNT'
}
interface DiscountPayload {
  type: TypeDiscount
  value: number
}

/**
 * Apply a discount to the reducer state in a mathematically-exact way.
 *
 * - Supports two discount types: "PERCENT" (0-100) and "AMOUNT" (fixed currency amount).
 * - Works in integer cents to avoid floating point errors, distributes rounding
 *   remainders using the Largest Remainder Method so allocations sum exactly.
 * - BEFORE applying a new discount, restores original prices if they were previously saved
 *   (originalProPrice and originalNewExtraPrice). This prevents stacking discounts.
 * - Applies discount first to `ProPrice` (base) and, if needed, to `dataExtra[].newExtraPrice`
 *   proportionally, never producing negative prices.
 * - Returns a new state (immutable) and sets metadata: discountType, discountPercent,
 *   discountAmount, discountBreakdown and preserves original prices in `originalProPrice`
 *   and `dataExtra[].originalNewExtraPrice`.
 *
 * NOTE: Uses optional `sendNotification` to report errors/success.
 *
 * @param {any} state - current reducer state
 * @param {{ type: string, value: number }} payload - { type: 'PERCENT'|'AMOUNT', value: number }
 * @param {(notification: {title:string,backgroundColor:'success'|'error'|'warning'|'info',description:string}) => void} sendNotification
 * @returns {any} new state with discounts applied (idempotent w.r.t repeated calls)
 */
export const applyDiscountToCart = (
  state: any,
  payload: DiscountPayload,
  sendNotification?: (notification: {
    title: string
    backgroundColor: 'success' | 'error' | 'warning' | 'info'
    description: string
  }) => void
) => {
  const discountType = (payload?.type ?? TypeDiscount.PERCENT).toString().toUpperCase()
  const rawValue = Number(payload?.value)

  // Basic validations
  if (!Array.isArray(state?.PRODUCT) || state.PRODUCT.length === 0) {
    sendNotification?.({
      title: 'Warning',
      backgroundColor: 'warning',
      description: 'No items in cart to apply discount.'
    })
    return {
      ...state,
      discountType,
      discountPercent: 0,
      discountAmount: 0,
      discountBreakdown: []
    }
  }

  if (Number.isNaN(rawValue) || rawValue < 0) {
    sendNotification?.({
      title: 'Error',
      backgroundColor: 'error',
      description: 'Invalid discount value.'
    })
    return state
  }

  if (discountType !== TypeDiscount.PERCENT && discountType !== TypeDiscount.AMOUNT) {
    sendNotification?.({
      title: 'Error',
      backgroundColor: 'error',
      description: 'Invalid discount type.'
    })
    return state
  }

  if (discountType === TypeDiscount.PERCENT && (rawValue < 0 || rawValue > 100)) {
    sendNotification?.({
      title: 'Error',
      backgroundColor: 'warning',
      description: 'Percentage must be between 0 and 100.'
    })
    return state
  }

  // Helpers - work in cents to preserve exactness
  const toCents = (n: number) => { return Math.round((Number(n) || 0) * 100) }
  const fromCents = (c: number) => { return c / 100 }

  // --- Normalize / Restore originals to avoid stacking discounts ---
  // For each product, derive the NON-discounted base via the shared pricing
  // helper (free → 0; otherwise unitPrice*qty, originalProPrice or ProPrice, in
  // that order). `free` products are courtesy lines with ABSOLUTE priority:
  // their base and extras are forced to 0 so they are never discountable and
  // never contribute to the discountable cart total.
  const normalizedItems = state.PRODUCT.map((item: any) => {
    const isFree = item?.free === true

    // Base = non-discounted line total for this product (0 when free).
    const baseCents = isFree ? 0 : toCents(resolveBaseLineTotal(item))

    // Normalize extras: preserve originalNewExtraPrice if exists, else take
    // current newExtraPrice. Free lines contribute 0 for extras too.
    const extrasRaw = Array.isArray(item.dataExtra) ? item.dataExtra : []
    const extrasNormalized = extrasRaw.map((ex: any) => {
      const origExRaw =
        ex.originalNewExtraPrice !== undefined && ex.originalNewExtraPrice !== null
          ? Number(ex.originalNewExtraPrice)
          : Number(ex.newExtraPrice || 0)
      return {
        originalExtraObject: ex,
        originalNewExtraPriceRaw: origExRaw,
        originalNewExtraPriceCents: isFree ? 0 : toCents(origExRaw)
      }
    })

    const extrasCentsList = extrasNormalized.map((e: any) => { return e.originalNewExtraPriceCents })
    const extrasTotalCents = extrasCentsList.reduce((s: number, v: number) => { return s + v }, 0)
    const itemTotalCents = baseCents + extrasTotalCents

    return {
      originalItem: item,
      isFree,
      baseCents,
      extrasNormalized,
      extrasCentsList,
      extrasTotalCents,
      itemTotalCents
    }
  })

  const cartTotalCents = normalizedItems.reduce((s: number, it: any) => { return s + it.itemTotalCents }, 0)

  if (cartTotalCents === 0) {
    sendNotification?.({
      title: 'Warning',
      backgroundColor: 'warning',
      description: 'Cart total is zero; nothing to discount.'
    })
    // Nothing is discountable (empty cart or all-free). Restore every product to
    // its non-discounted price so a previous discount never lingers, and reset
    // the discount metadata.
    return {
      ...state,
      PRODUCT: state.PRODUCT.map((item: any) => restoreProductPricing(item)),
      discountType,
      discountPercent: 0,
      discountAmount: 0,
      discountBreakdown: []
    }
  }

  // Determine requested total discount in cents
  let totalDiscountCents = 0
  if (discountType === TypeDiscount.PERCENT) {
    totalDiscountCents = Math.round((cartTotalCents * rawValue) / 100)
  } else {
    totalDiscountCents = toCents(rawValue)
    // Cap to cart total
    if (totalDiscountCents > cartTotalCents) {
      totalDiscountCents = cartTotalCents
    }
  }

  // No discount to apply. This is the path taken by "Eliminar descuento"
  // (value 0) and by a 0% / $0 entry. We RESTORE every product to its
  // non-discounted price (from originalProPrice or unitPrice*qty, free → 0) and
  // strip the per-item discount footprint, so removing a discount always brings
  // the prices back to what the product configuration dictates.
  if (totalDiscountCents <= 0) {
    sendNotification?.({
      title: 'Notice',
      backgroundColor: 'info',
      description: 'No discount applied.'
    })
    return {
      ...state,
      PRODUCT: state.PRODUCT.map((item: any) => restoreProductPricing(item)),
      discountType,
      // For AMOUNT discounts the percentage is not a user-provided figure, so we
      // keep it at 0 to avoid persisting a misleading value. `discountType` is
      // the single source of truth for the mode; `discountAmount` holds the money.
      discountPercent: discountType === TypeDiscount.PERCENT ? rawValue : 0,
      discountAmount: fromCents(totalDiscountCents),
      discountBreakdown: []
    }
  }

  // ---- Allocation using Largest Remainder Method (exact cents) ----
  const rawAllocs = normalizedItems.map((it: any) => { return (it.itemTotalCents * totalDiscountCents) / cartTotalCents })
  const floorAllocs = rawAllocs.map((v: any) => { return Math.floor(v) })
  const remainders = rawAllocs.map((v: any, i: number) => { return { idx: i, rem: v - floorAllocs[i] } })
  const sumFloor = floorAllocs.reduce((s: number, v: number) => { return s + v }, 0)
  let remainingCents = totalDiscountCents - sumFloor

  remainders.sort((a: any, b: any) => { return b.rem - a.rem })
  const finalAllocs = [...floorAllocs]
  for (let i = 0; i < remainders.length && remainingCents > 0; i++) {
    finalAllocs[remainders[i].idx] += 1
    remainingCents -= 1
  }

  // ---- Apply allocations to restored originals (base first, then extras) ----
  const breakdown: { pId: string | number; discountAmount: number }[] = []
  const newProducts = normalizedItems.map((it: any, idx: number) => {
    const allocated = finalAllocs[idx] // cents
    let remainingToTake = allocated

    // Apply on base
    const origBaseCents = it.baseCents
    const usedOnBase = Math.min(origBaseCents, remainingToTake)
    const baseAfter = origBaseCents - usedOnBase
    remainingToTake -= usedOnBase

    // Apply on extras proportionally if needed
    let newExtrasCentsList = it.extrasCentsList.slice() // copy
    if (remainingToTake > 0 && it.extrasTotalCents > 0) {
      const extrasTotal = it.extrasTotalCents
      // raw per-extra allocation
      const rawExtraAllocs = newExtrasCentsList.map((exCents: number) => { return (exCents / extrasTotal) * remainingToTake })
      const floorExtraAllocs = rawExtraAllocs.map((v: number) => { return Math.floor(v) })
      const usedExtraFloor = floorExtraAllocs.reduce((s: number, v: number) => { return s + v }, 0)
      let rest = remainingToTake - usedExtraFloor

      const extraRemainders = rawExtraAllocs.map((v: number, i: number) => { return { idx: i, rem: v - floorExtraAllocs[i] } })
      extraRemainders.sort((a: any, b: any) => { return b.rem - a.rem })
      const finalExtraAllocs = [...floorExtraAllocs]
      for (let k = 0; k < extraRemainders.length && rest > 0; k++) {
        finalExtraAllocs[extraRemainders[k].idx] += 1
        rest -= 1
      }

      // apply finalExtraAllocs with cap
      newExtrasCentsList = newExtrasCentsList.map((exCents: number, i: number) => {
        const reduceBy = Math.min(exCents, finalExtraAllocs[i])
        return exCents - reduceBy
      })

      remainingToTake = 0
    }

    // Build updated product object:
    const newBaseCents = baseAfter
    const newProPrice = fromCents(newBaseCents)

    const originalExtrasObjects = it.extrasNormalized.map((e: any) => { return e.originalExtraObject || {} })
    const newDataExtra = originalExtrasObjects.map((exObj: any, i: number) => {
      const newExtraPrice = fromCents(newExtrasCentsList[i] || 0)
      // preserve originalNewExtraPrice on each extra (if not already)
      return {
        ...exObj,
        originalNewExtraPrice: exObj.originalNewExtraPrice === undefined ? exObj.newExtraPrice : exObj.originalNewExtraPrice,
        newExtraPrice
      }
    })

    const appliedDiscountCents = allocated - remainingToTake
    breakdown.push({ pId: it.originalItem.pId, discountAmount: fromCents(appliedDiscountCents) })

    // FREE lines have absolute priority: they are never discounted. Keep the
    // courtesy price at 0, carry no `originalProPrice` and record a 0 discount
    // in the breakdown, so a gift stays out of the discount accounting even
    // when a global discount is applied to the rest of the cart.
    if (it.isFree) {
      const { originalProPrice, ...restFree } = it.originalItem ?? {}
      return {
        ...restFree,
        ProPrice: 0,
        dataExtra: newDataExtra,
        discountAmount: 0,
        discountPercent: 0
      }
    }

    const itemTotalCentsBefore = it.itemTotalCents || 0
    // eslint-disable-next-line
    const itemDiscountPercent = itemTotalCentsBefore > 0 ? +((appliedDiscountCents / itemTotalCentsBefore) * 100).toFixed(4) : 0

    return {
      ...it.originalItem,
      // Save the non-discounted base so future calls (edit/remove) can restore
      // it. Prefer the already-saved originalProPrice to stay idempotent across
      // repeated applications.
      originalProPrice:
        it.originalItem.originalProPrice ?? fromCents(it.baseCents),
      ProPrice: newProPrice,
      dataExtra: newDataExtra,
      // per-item metadata
      discountAmount: fromCents(appliedDiscountCents),
      discountPercent: itemDiscountPercent
    }
  })

  // Final safety check & tiny correction if needed. The adjustment is applied
  // to the first NON-FREE product so a rounding cent is never charged against a
  // courtesy line (which must always stay at 0).
  const allocatedSumCents = breakdown.reduce((s, b) => { return s + toCents(Number(b.discountAmount) || 0) }, 0)
  if (allocatedSumCents !== totalDiscountCents) {
    const diff = totalDiscountCents - allocatedSumCents
    const adjustIndex = newProducts.findIndex((p: any) => p?.free !== true)
    if (adjustIndex !== -1 && diff !== 0) {
      const target = newProducts[adjustIndex]
      target.discountAmount = Number(target.discountAmount || 0) + fromCents(diff)
      const adjustOnBase = Math.min(toCents(target.ProPrice), diff)
      target.ProPrice = fromCents(Math.max(0, toCents(target.ProPrice) - adjustOnBase))
      breakdown[adjustIndex].discountAmount = Number(breakdown[adjustIndex].discountAmount || 0) + fromCents(diff)
    }
  }
  sendNotification?.({
    title: 'Discount applied',
    backgroundColor: 'success',
    description: `${discountType === TypeDiscount.PERCENT ? rawValue + '%' : fromCents(totalDiscountCents)} discount applied successfully.`
  })

  return {
    ...state,
    PRODUCT: newProducts,
    discountType,
    // PERCENT → store the user-entered percentage (0-100). AMOUNT → the
    // percentage is not meaningful, so it stays 0; `discountAmount` carries the
    // exact money discounted and `discountType` identifies the mode.
    discountPercent: discountType === TypeDiscount.PERCENT ? rawValue : 0,
    discountAmount: fromCents(totalDiscountCents),
    discountBreakdown: breakdown
  }
}

/**
 * Re-run the currently active global discount over the given state.
 *
 * Use this after any mutation that changes what is discountable (e.g. toggling
 * a product's `free` flag, changing a quantity) so the global discount figures
 * (`discountAmount`, `discountPercent`, `discountBreakdown`) and each product's
 * `ProPrice` are recomputed from the clean base. Because `applyDiscountToCart`
 * always restores from `originalProPrice`/`unitPrice*qty` before applying, this
 * never stacks discounts.
 *
 * It is a no-op (returns the state unchanged) when there is no active discount,
 * so it is always safe to call.
 *
 * @param {any} state - current reducer state (after the mutation).
 * @returns {any} state with the active discount re-applied, or the same state.
 */
export const reapplyActiveDiscount = (state: any) => {
  const type = (state?.discountType ?? TypeDiscount.PERCENT).toString().toUpperCase()

  const value = type === TypeDiscount.AMOUNT
    ? Number(state?.discountAmount)
    : Number(state?.discountPercent)

  // No active discount → nothing to recompute.
  if (!Number.isFinite(value) || value <= 0) {
    return state
  }

  // Re-apply quietly (no notification): this is an internal reconciliation,
  // not a user-initiated discount action.
  return applyDiscountToCart(
    state,
    { type: type as TypeDiscount, value },
    undefined
  )
}
