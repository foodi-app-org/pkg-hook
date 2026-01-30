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
  const toCents = (n: number) => {return Math.round((Number(n) || 0) * 100)}
  const fromCents = (c: number) => {return c / 100}

  // --- Normalize / Restore originals to avoid stacking discounts ---
  // For each product, use saved original prices if present; otherwise use current as "original"
  const normalizedItems = state.PRODUCT.map((item: any) => {
    // Determine original base price (prefer originalProPrice if present)
    const origBaseRaw =
      item.originalProPrice !== undefined && item.originalProPrice !== null
        ? Number(item.originalProPrice)
        : Number(item.ProPrice || 0)

    const baseCents = toCents(origBaseRaw)

    // Normalize extras: preserve originalNewExtraPrice if exists, else take current newExtraPrice
    const extrasRaw = Array.isArray(item.dataExtra) ? item.dataExtra : []
    const extrasNormalized = extrasRaw.map((ex: any) => {
      const origExRaw =
        ex.originalNewExtraPrice !== undefined && ex.originalNewExtraPrice !== null
          ? Number(ex.originalNewExtraPrice)
          : Number(ex.newExtraPrice || 0)
      return {
        originalExtraObject: ex,
        originalNewExtraPriceRaw: origExRaw,
        originalNewExtraPriceCents: toCents(origExRaw)
      }
    })

    const extrasCentsList = extrasNormalized.map((e: any) => {return e.originalNewExtraPriceCents})
    const extrasTotalCents = extrasCentsList.reduce((s: number, v: number) => {return s + v}, 0)
    const itemTotalCents = baseCents + extrasTotalCents

    return {
      originalItem: item,
      baseCents,
      extrasNormalized,
      extrasCentsList,
      extrasTotalCents,
      itemTotalCents
    }
  })

  const cartTotalCents = normalizedItems.reduce((s: number, it: any) => {return s + it.itemTotalCents}, 0)

  if (cartTotalCents === 0) {
    sendNotification?.({
      title: 'Warning',
      backgroundColor: 'warning',
      description: 'Cart total is zero; nothing to discount.'
    })
    return {
      ...state,
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

  // If no discount to apply
  if (totalDiscountCents <= 0) {
    sendNotification?.({
      title: 'Notice',
      backgroundColor: 'info',
      description: 'No discount applied.'
    })
    return {
      ...state,
      discountType,
      discountPercent: discountType === TypeDiscount.PERCENT ? rawValue : +((totalDiscountCents / cartTotalCents) * 100).toFixed(2),
      discountAmount: fromCents(totalDiscountCents),
      discountBreakdown: []
    }
  }

  // ---- Allocation using Largest Remainder Method (exact cents) ----
  const rawAllocs = normalizedItems.map((it: any) => {return (it.itemTotalCents * totalDiscountCents) / cartTotalCents})
  const floorAllocs = rawAllocs.map((v: any) => {return Math.floor(v)})
  const remainders = rawAllocs.map((v: any, i: number) => {return { idx: i, rem: v - floorAllocs[i] }})
  const sumFloor = floorAllocs.reduce((s: number, v: number) => {return s + v}, 0)
  let remainingCents = totalDiscountCents - sumFloor

  remainders.sort((a: any, b: any) => {return b.rem - a.rem})
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
      const rawExtraAllocs = newExtrasCentsList.map((exCents: number) => {return (exCents / extrasTotal) * remainingToTake})
      const floorExtraAllocs = rawExtraAllocs.map((v: number) => {return Math.floor(v)})
      const usedExtraFloor = floorExtraAllocs.reduce((s: number, v: number) => {return s + v}, 0)
      let rest = remainingToTake - usedExtraFloor

      const extraRemainders = rawExtraAllocs.map((v: number, i: number) => {return { idx: i, rem: v - floorExtraAllocs[i] }})
      extraRemainders.sort((a: any, b: any) => {return b.rem - a.rem})
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

    const originalExtrasObjects = it.extrasNormalized.map((e: any) => {return e.originalExtraObject || {}})
    const newDataExtra = originalExtrasObjects.map((exObj: any, i: number) => {
      const newExtraPrice = fromCents(newExtrasCentsList[i] || 0)
      // preserve originalNewExtraPrice on each extra (if not already)
      return {
        ...exObj,
        originalNewExtraPrice: exObj.originalNewExtraPrice !== undefined ? exObj.originalNewExtraPrice : exObj.newExtraPrice,
        newExtraPrice
      }
    })

    const appliedDiscountCents = allocated - remainingToTake
    breakdown.push({ pId: it.originalItem.pId, discountAmount: fromCents(appliedDiscountCents) })

    const itemTotalCentsBefore = it.itemTotalCents || 0
    const itemDiscountPercent = itemTotalCentsBefore > 0 ? +((appliedDiscountCents / itemTotalCentsBefore) * 100).toFixed(4) : 0

    return {
      ...it.originalItem,
      // save originalProPrice if not present (so future calls can restore)
      originalProPrice:
        it.originalItem.originalProPrice !== undefined && it.originalItem.originalProPrice !== null
          ? it.originalItem.originalProPrice
          : fromCents(it.baseCents),
      ProPrice: newProPrice,
      dataExtra: newDataExtra,
      // per-item metadata
      discountAmount: fromCents(appliedDiscountCents),
      discountPercent: itemDiscountPercent
    }
  })

  // Final safety check & tiny correction if needed
  const allocatedSumCents = breakdown.reduce((s, b) => {return s + toCents(Number(b.discountAmount) || 0)}, 0)
  if (allocatedSumCents !== totalDiscountCents) {
    const diff = totalDiscountCents - allocatedSumCents
    if (newProducts.length > 0 && diff !== 0) {
      const first = newProducts[0]
      first.discountAmount = Number(first.discountAmount || 0) + fromCents(diff)
      const adjustOnBase = Math.min(toCents(first.ProPrice), diff)
      first.ProPrice = fromCents(Math.max(0, toCents(first.ProPrice) - adjustOnBase))
      breakdown[0].discountAmount = Number(breakdown[0].discountAmount || 0) + fromCents(diff)
    }
  }

  const overallPercent = +((totalDiscountCents / cartTotalCents) * 100).toFixed(4)

  sendNotification?.({
    title: 'Discount applied',
    backgroundColor: 'success',
    description: `${discountType === TypeDiscount.PERCENT ? rawValue + '%' : fromCents(totalDiscountCents)} discount applied successfully.`
  })

  return {
    ...state,
    PRODUCT: newProducts,
    discountType,
    discountPercent: discountType === TypeDiscount.PERCENT ? rawValue : overallPercent,
    discountAmount: fromCents(totalDiscountCents),
    discountBreakdown: breakdown
  }
}
