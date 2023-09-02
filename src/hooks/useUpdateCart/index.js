import debounce from 'lodash'
import { useState, useEffect } from 'react'
import { getCurrentDomain } from '../../utils'
import { trigger } from '../useEvent'
import { Cookies } from '../../cookies'

// EXAMPLE
// https://codesandbox.io/s/nextjs-cart-system-tfg1e?file=/pages/_app.js

// Method to execute the event to add all items of the app.cart cookie
const updateCart = debounce.debounce((items = []) => {
  trigger({ eventType: 'app.cart', data: { loading: true, items } })
}, 3000)

const EMPTY_CART = {
  items: [],
  total: 0
}

export const useUpdateCart = () => {
  const domain = getCurrentDomain()
  const keyToSaveData = 'app.cart'
  const saveDataState = JSON.parse(Cookies.get(keyToSaveData) || '[]')
  const [cart, setCart] = useState(EMPTY_CART)

  useEffect(() => {
    // restore cart from cookie, this could also be tracked in a db
    const cart = Cookies.get(keyToSaveData)

    // if items in cart, set items and total to state
    if (typeof cart === 'string' && cart !== 'undefined') {
      const cartData = JSON.parse(cart)
      const total = cartData.reduce(
        (total, item) => { return total + item.price * item.quantity },
        0
      )

      setCart({ items: cartData, total })
    }
  }, [])

  useEffect(() => {
    Cookies.set(keyToSaveData, JSON.stringify(cart.items), { domain, path: '/' })
  }, [cart, domain])

  const handleAdd = (item) => {
    // check for item already in cart
    // if not in cart, add item else if item is found increment quantity
    const itemExists = cart.items.find((i) => { return i.pId === item.pId })

    if (!itemExists) {
      setCart((prevCart) => {
        return {
          items: [...prevCart.items, { ...item, quantity: 1 }],
          total: prevCart.total + item.price
        }
      })

      return
    }

    setCart((prevCart) => {
      return {
        items: prevCart.items.map((i) => {
          if (i.pId === item.pId) {
            return { ...i, quantity: i.quantity + 1 }
          }

          return i
        }),
        total: prevCart.total + item.price
      }
    })
    updateCart(cart)
  }

  const deleteProductCart = (item) => {
    setCart((prevCart) => {
      const items = prevCart.items
      const index = items.findIndex((i) => { return i.pId === item.pId })

      items.splice(index, 1)

      const total = items.reduce((t, i) => { return t + i.quantity * i.price }, 0)

      return { items, total }
    })
  }

  const decreaseItemFromCart = (item) => {
    // check for item already in cart
    // if quantity is more then  in cart, subtract item else remove item
    const itemInCart = cart.items.find((i) => { return i.pId === item.pId })

    if (!itemInCart) {
      return
    }

    if (itemInCart.quantity === 1) {
      deleteProductCart(item)

      return
    }

    setCart((prevCart) => {
      return {
        items: prevCart.items.map((i) => {
          if (i.pId === item.pId) {
            return { ...i, quantity: item.quantity - 1 }
          }

          return i
        }),
        total: prevCart.total - item.price
      }
    })
  }

  const clearCart = () => {
    setCart(EMPTY_CART)
  }

  return {
    saveDataState,
    clearCart,
    deleteProductCart,
    decreaseItemFromCart,
    handleAdd
  }
}
