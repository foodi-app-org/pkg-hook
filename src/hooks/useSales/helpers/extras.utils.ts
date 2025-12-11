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
      const newExtraPrice = newQuantity === 0 ? extraPrice : extraPrice * newQuantity
      return { ...producto, quantity: newQuantity, newExtraPrice }
    }
    return producto
  })
}
