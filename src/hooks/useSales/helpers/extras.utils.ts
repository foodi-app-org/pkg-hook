/**
 * extrasUtils.ts
 * Increment/decrement extras handling as pure functions returning new arrays.
 */

/**
 * Increment extra entry
 * @param {Array} dataExtra
 * @param {string|number} exPid
 * @returns {Array}
 */
export const incrementExtra = (dataExtra = [], exPid: string | number) => {
  if (!Array.isArray(dataExtra)) return []
  return dataExtra.map((producto: any) => {
    if (producto.exPid === exPid) {
      const initialQuantity = producto.quantity ? producto.quantity : 0
      const newQuantity = initialQuantity + 1
      const newExtraPrice = (producto.extraPrice || 0) * newQuantity
      return { ...producto, quantity: newQuantity, newExtraPrice }
    }
    return producto
  })
}

/**
 * Decrement extra entry
 * @param {Array} dataExtra
 * @param {string|number} exPid
 * @returns {Array}
 */
export const decrementExtra = (dataExtra = [], exPid: string | number) => {
  if (!Array.isArray(dataExtra)) return []
  return dataExtra.map((producto: any) => {
    if (producto.exPid === exPid) {
      const { quantity = 0, extraPrice = 0 } = producto
      const newQuantity = Math.max(quantity - 1, 0)
      const newExtraPrice = newQuantity === 0 ? 0 : extraPrice * newQuantity
      return { ...producto, quantity: newQuantity, newExtraPrice }
    }
    return producto
  })
}

/**
 * Remove an extra from the current selection.
 *
 * In the POS, "removing" a complement that has already been added to a product
 * means resetting its selected quantity (and therefore its line total) to 0,
 * NOT deleting the catalog entry. The extra stays in the list so the operator
 * can add it again, but it no longer contributes to the product total.
 *
 * The unit price (`extraPrice`) is preserved so the row can keep showing the
 * real price instead of $0.
 *
 * @param {Array} dataExtra
 * @param {string|number} exPid
 * @returns {Array}
 */
export const removeExtra = (dataExtra = [], exPid: string | number) => {
  if (!Array.isArray(dataExtra)) return []
  return dataExtra.map((producto: any) => {
    if (producto.exPid === exPid) {
      return { ...producto, quantity: 0, newExtraPrice: 0 }
    }
    return producto
  })
}
