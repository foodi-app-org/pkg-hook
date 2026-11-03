import { recalculateCounter } from './recalculateCounter.utils'

/**
 *
 * @param state
 * @param action
 * @param productsFood
 * @returns updated state
 */
export function handleRemoveProduct(state: any, action: any, productsFood: any) {
  const productExist = state?.PRODUCT.find((items: any) => {
    return items.pId === action.payload.pId
  })
  // unitPrice is stored on the cart item when added; fall back to catalog price.
  // Using catalog price (OurProduct.ProPrice) is intentionally avoided here because
  // the cart item may carry a discounted unit price that differs from the catalog.
  const perUnitPrice: number =
    typeof productExist?.unitPrice === 'number' && productExist.unitPrice >= 0
      ? productExist.unitPrice
      : (productsFood.find((items: any) => items.pId === action.payload.pId)?.ProPrice ?? 0)

  const nextProducts =
    action.payload.ProQuantity > 1
      ? state.PRODUCT.map((items: any) => {
        return items.pId === action.payload.pId
          ? {
            ...items,
            pId: action.payload.pId,
            ProQuantity: items.ProQuantity - 1,
            // Keep the baseline aligned so a later edit/cancel restores the
            // correct quantity after a decrement.
            oldQuantity: items.ProQuantity - 1,
            ProPrice: Math.max(0, (items.ProPrice ?? 0) - perUnitPrice)
          }
          : items
      })
      : state.PRODUCT.filter((items: any) => {
        return items.pId !== action.payload.pId
      })

  return {
    ...state,
    // Counter derived from the real cart, never a blind -1.
    counter: recalculateCounter(nextProducts),
    totalAmount: state.totalAmount - action.payload.ProPrice,
    PRODUCT: nextProducts
  }
}