
import { SalesReducerAction, SalesState } from '../types'

import { isStockInsufficient } from './isStockInsufficient'

import type { Product, SendNotificationFn } from 'typesdefs'

interface AddToCartProps {
  state: SalesState
  action: SalesReducerAction
  product: Product | null
  sendNotification?: SendNotificationFn
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
  state,
  action,
  product,
  sendNotification = () => { },
  sendAlertStock = () => { }
}: AddToCartProps) => {
  if (!('payload' in action)) {
    // If action does not have payload, return state or handle accordingly
    return state
  }
  const payload = action.payload
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

  if (!product) return state

  // Determine whether the product tracks inventory. Defaults to the catalog
  // product value, falling back to the payload so stock is respected even when
  // `manageStock` is not explicitly set.
  const managesStock = Boolean(product.manageStock ?? payload.manageStock)

  // Raw stock value as provided (used to detect an explicit "0 = agotado").
  const rawStock = product.stock ?? stock

  // Normalize the real available stock to a number. Prefer the catalog product
  // value, fall back to the payload. Treats null/undefined/NaN as 0.
  const availableStock = Math.max(0, Number(rawStock ?? 0) || 0)

  // A product is considered "out of stock" when its stock is explicitly 0,
  // regardless of the manageStock flag. This prevents adding agotado products.
  const isExplicitlyOutOfStock =
    rawStock !== null &&
    rawStock !== undefined &&
    Number(rawStock) === 0

  // PRE-FETCH product references (only ONCE)
  const productExistIndex = state.PRODUCT.findIndex((item: Product) => {return item.pId === pId})
  const productExist = productExistIndex !== -1 ? state.PRODUCT[productExistIndex] : null

  // How many units of this product are already in the cart.
  const currentQty = productExist?.ProQuantity ?? 0

  // Out-of-stock guard: an explicit stock of 0 always blocks the add.
  if (isExplicitlyOutOfStock) {
    sendNotification({
      title: 'Sin stock',
      backgroundColor: 'warning',
      description: 'Producto sin stock disponible en tu inventario'
    })
    return state
  }

  // Stock enforcement when the product tracks inventory: the quantity already
  // in the cart cannot reach/exceed the available stock.
  if (managesStock && isStockInsufficient(currentQty, availableStock)) {
    sendAlertStock(availableStock)
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
      manageStock: managesStock,
      ProDescription,
      ProImage,
      ProPrice,
      stock: availableStock,
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
    genderTags: product.genderTags,
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