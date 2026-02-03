// useUpdateCart.ts
import debounce from 'lodash/debounce'
import { useState, useEffect } from 'react'

import { Cookies } from '../../cookies'
import { getCurrentDomain } from '../../utils'
import { trigger } from '../useEvent'

/**
 * Single cart item
 */
export type CartItem = {
  pId: string
  price: number
  quantity: number
  // allow extra fields from the product object
  [key: string]: unknown
}

/**
 * Cart shape
 */
export type Cart = {
  items: CartItem[]
  total: number
}

const EMPTY_CART: Cart = {
  items: [],
  total: 0
}

/**
 * Debounced update that triggers an app event with items payload.
 * The debounced function expects an array of CartItem.
 */
const updateCart = debounce((items: CartItem[] = []) => {
  trigger({ eventType: 'app.cart', data: { loading: true, items } })
}, 3000)

/**
 * Hook return shape
 */
export type UseUpdateCartReturn = {
  saveDataState: CartItem[]
  clearCart: () => void
  deleteProductCart: (item: CartItem) => void
  decreaseItemFromCart: (item: CartItem) => void
  handleAdd: (item: CartItem) => void
  cart: Cart
}

/**
 * useUpdateCart
 * Manages a small cart saved in cookie and triggers global events.
 * @returns {UseUpdateCartReturn} Cart management functions and state.
 */
export const useUpdateCart = (): UseUpdateCartReturn => {
  const rawDomain = getCurrentDomain()
  const domain = typeof rawDomain === 'string' ? rawDomain : undefined
  const keyToSaveData = 'app.cart'

  // initial saved data (array of items) from cookie
  const saveDataState: CartItem[] = (() => {
    try {
      const raw = Cookies.get(keyToSaveData)
      return raw && raw !== 'undefined' ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })()

  const [cart, setCart] = useState<Cart>(() => {
    // initialize total from saved items
    const total = saveDataState.reduce((acc, it) => acc + (it.price * (it.quantity ?? 1)), 0)
    return { items: saveDataState, total }
  })

  // Restore cart from cookie (runs once)
  useEffect(() => {
      const cartRaw = Cookies.get(keyToSaveData)
      if (typeof cartRaw === 'string' && cartRaw !== 'undefined') {
        const cartData: CartItem[] = JSON.parse(cartRaw)
        const total = cartData.reduce((total, item) => total + item.price * (item.quantity ?? 1), 0)
        setCart({ items: cartData, total })
      }
  }, [])

  // Persist cart.items to cookie whenever cart changes
  useEffect(() => {
    try {
      Cookies.set(keyToSaveData, JSON.stringify(cart.items), { domain, path: '/' })
    } catch {
      // ignore cookie errors - optionally setError or console.warn
    }
  }, [cart, domain])

  /**
   * Add item to cart. If exists, increments quantity.
   * @param item
   */
  const handleAdd = (item: CartItem): void => {
    setCart(prevCart => {
      const itemExists = prevCart.items.find(i => i.pId === item.pId)

      if (!itemExists) {
        const newItems = [...prevCart.items, { ...item, quantity: 1 }]
        const newTotal = prevCart.total + item.price
        const newState = { items: newItems, total: newTotal }
        updateCart(newItems)
        return newState
      }

      const newItems = prevCart.items.map(i => {
        if (i.pId === item.pId) {
          return { ...i, quantity: (i.quantity ?? 0) + 1 }
        }
        return i
      })
      const newTotal = prevCart.total + item.price
      const newState = { items: newItems, total: newTotal }
      updateCart(newItems)
      return newState
    })
  }

  /**
   * Delete product from cart completely.
   * @param item
   */
  const deleteProductCart = (item: CartItem): void => {
    setCart(prevCart => {
      const items = prevCart.items.filter(i => i.pId !== item.pId)
      const total = items.reduce((t, i) => t + (i.quantity ?? 0) * i.price, 0)
      const newState = { items, total }
      updateCart(items)
      return newState
    })
  }

  /**
   * Decrease quantity of an item by one. If quantity becomes 0, remove item.
   * @param item
   */
  const decreaseItemFromCart = (item: CartItem): void => {
    setCart(prevCart => {
      const itemInCart = prevCart.items.find(i => i.pId === item.pId)
      if (!itemInCart) return prevCart

      if ((itemInCart.quantity ?? 0) <= 1) {
        const itemsAfterRemove = prevCart.items.filter(i => i.pId !== item.pId)
        const totalAfterRemove = itemsAfterRemove.reduce((t, i) => t + (i.quantity ?? 0) * i.price, 0)
        const newState = { items: itemsAfterRemove, total: totalAfterRemove }
        updateCart(itemsAfterRemove)
        return newState
      }

      const newItems = prevCart.items.map(i => {
        if (i.pId === item.pId) {
          return { ...i, quantity: (i.quantity ?? 0) - 1 }
        }
        return i
      })
      const newTotal = prevCart.total - item.price
      const newState = { items: newItems, total: newTotal }
      updateCart(newItems)
      return newState
    })
  }

  const clearCart = (): void => {
    setCart(EMPTY_CART)
    updateCart([])
  }

  return {
    saveDataState,
    clearCart,
    deleteProductCart,
    decreaseItemFromCart,
    handleAdd,
    cart
  }
}
