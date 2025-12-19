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
  sendNotification?: Function;
}) => {
  const sourceProduct = productsFood.find(
    (product) => product.pId === productId
  );

  if (!sourceProduct) return state;

  const PRODUCT = state.PRODUCT.map((item: any) => {
    if (item.pId !== productId) return item;

    const {
      stock = 0,
      manageStock,
      ProPrice: unitPrice = 0
    } = sourceProduct;

    const isFree = Boolean(item.free);
    const newQuantity = item.ProQuantity + 1;

    // Stock = 0
    if (stock === 0) {
      sendNotification({
        title: 'Sin stock',
        backgroundColor: 'warning',
        description: `El producto ${item.pName} está agotado y no puede ser añadido al carrito.`
      });
      return item;
    }

    // Stock exceeded
    if (manageStock && newQuantity > stock) {
      sendNotification({
        title: 'Stock insuficiente',
        backgroundColor: 'warning',
        description: `No puedes agregar más unidades de ${item.pName}, stock disponible: ${stock}`
      });
      return item;
    }

    return {
      ...item,
      ProQuantity: newQuantity,
      ProPrice: isFree ? 0 : newQuantity * unitPrice
    };
  });

  return {
    ...state,
    counter: state.counter + 1,
    PRODUCT
  };
};
