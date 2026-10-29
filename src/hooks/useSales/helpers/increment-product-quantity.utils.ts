import type { SendNotificationFn } from 'typesdefs';

/**
 * Increments product quantity in cart safely.
 * - Validates stock
 * - Respects free mode
 * - Avoids unnecessary mutations
 *
 * @param {Object} params
 * @param {Object} params.state - Current reducer state
 * @param {string | number} params.productId - Product identifier
 * @param {Object[]} params.productsFood - Source products list
 * @param {Function} params.sendNotification - Notification handler
 *
 * @returns {Object} Updated state
 */
export const incrementProductQuantity = ({
  state,
  productId,
  productsFood = [],
  sendNotification = () => {}
}: {
  state: any;
  productId: string | number;
  productsFood: any[];
  sendNotification?: SendNotificationFn;
}) => {
  const sourceProduct = productsFood.find(
    (product) => {return product.pId === productId}
  )

  if (!sourceProduct) return state

  const PRODUCT = state.PRODUCT.map((item: any) => {
    if (item.pId !== productId) return item

    const {
      manageStock,
      ProPrice: unitPrice = 0
    } = sourceProduct

    // Raw stock value as provided (used to detect an explicit "0 = agotado").
    const rawStock = sourceProduct.stock

    // Normalize stock to a number (handles string/null/undefined/NaN as 0).
    const availableStock = Math.max(0, Number(rawStock ?? 0) || 0)

    // A product is considered "out of stock" when its stock is explicitly 0,
    // regardless of the manageStock flag.
    const isExplicitlyOutOfStock =
      rawStock !== null &&
      rawStock !== undefined &&
      Number(rawStock) === 0

    const managesStock = Boolean(manageStock ?? item.manageStock)

    const isFree = Boolean(item.free)
    const newQuantity = item.ProQuantity + 1

    // Out-of-stock guard: an explicit stock of 0 always blocks the increment.
    if (isExplicitlyOutOfStock) {
      sendNotification({
        title: 'Sin stock',
        backgroundColor: 'warning',
        description: `El producto ${item.pName} está agotado y no puede ser añadido al carrito.`
      })
      return item
    }

    // Requested quantity exceeds available stock (only when tracking inventory).
    if (managesStock && newQuantity > availableStock) {
      sendNotification({
        title: 'Stock insuficiente',
        backgroundColor: 'warning',
        description: `No puedes agregar más unidades de ${item.pName}, stock disponible: ${availableStock}`
      })
      return item
    }

    return {
      ...item,
      ProQuantity: newQuantity,
      ProPrice: isFree ? 0 : newQuantity * unitPrice
    }
  })

  return {
    ...state,
    counter: state.counter + 1,
    PRODUCT
  }
}
