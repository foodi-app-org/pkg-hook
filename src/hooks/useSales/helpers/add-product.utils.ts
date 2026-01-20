import { isStockInsufficient } from './isStockInsufficient'

interface AddToCartProps {
  state: any
  action: any
  product: any
  sendNotification: (notification: {
    title: string
    backgroundColor: string
    description: string
  }) => void
  sendAlertStock: (stock: number) => void
}

/**
 * Adds a product to the cart with maximum performance.
 * Avoids full array scans and minimizes object cloning.
 * @param {any} state - Current reducer state.
 * @param {any} action - Action containing product data.
 * @returns {any} Updated state.
 */
export const addToCartFunc = ({
  state = {},
  action = {},
  product,
  sendNotification = () => { },
  sendAlertStock = () => { }
}: AddToCartProps) => {
  const payload = action?.payload ?? {}
  const {
    pId,
    pName,
    getOneTags,
    stock,
    ProDescription,
    ProImage,
    ProPrice,
    ProDescuento
  } = payload

  // Validate basic stock
  if (stock === 0) {
    sendNotification({
      title: 'Sin stock',
      backgroundColor: 'warning',
      description: 'Producto sin stock disponible en tu inventario'
    })
    return state
  }

  // PRE-FETCH product references (only ONCE)
  const productExistIndex = state.PRODUCT.findIndex((item: any) => item.pId === pId)
  const productExist = productExistIndex !== -1 ? state.PRODUCT[productExistIndex] : null
  if (!product) return state

  // Check stock handling rules
  const currentQty = productExist?.ProQuantity ?? 0
  if (product.manageStock && isStockInsufficient(currentQty, product.stock)) {
    sendAlertStock(stock)
    return state
  }

  const isFree = productExist?.free ?? false
  const newQuantity = productExist ? currentQty + 1 : 1

  // Calculate new unit price only once
  const unitPrice = product.ProPrice ?? 0

  // Calculate final price respecting 'free' mode
  const newPrice = isFree ? 0 : newQuantity * unitPrice

  // COMMON STATE UPDATES
  const baseState = {
    ...state,
    counter: state.counter + 1,
    totalAmount: state.totalAmount + ProPrice,
    startAnimateUp: 'start-animate-up'
  }

  // CASE 1: Product does NOT exist → add it
  if (!productExist) {
    const newProduct = {
      pId,
      pName,
      editing: false,
      getOneTags,
      unitPrice,
      manageStock: product.manageStock ?? false,
      ProDescription,
      ProImage,
      ProPrice,
      stock,
      ProDescuento,
      ProQuantity: 1,
      free: false
    }

    return {
      ...baseState,
      PRODUCT: [...state.PRODUCT, newProduct]
    }
  }

  // CASE 2: Product already exists → update only ONE item
  const newList = [...state.PRODUCT]

  newList[productExistIndex] = {
    ...productExist,
    getOneTags: product.genderTags,
    unitPrice,
    editing: false,
    oldQuantity: newQuantity,
    ProPrice: newPrice,
    ProQuantity: newQuantity,
    free: isFree
  }

  return {
    ...baseState,
    PRODUCT: newList
  }
}