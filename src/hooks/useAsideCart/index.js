import { useState, useEffect, useMemo } from 'react'
import { useMutation } from '@apollo/client'
import { DELETE_ONE_ITEM_SHOPPING_PRODUCT } from './queries'
import { useGetCart } from '../useCart'
import { useManageQueryParams } from '../useManageQueryParams'

/**
 * Custom hook for managing the shopping cart functionality.
 * @param {Object} props - Props to control various UI elements.
 * @param {function} props.setCountItemProduct - Function to set the count of items in the cart.
 * @param {function} props.setAlertBox - Function to set an alert message.
 * @param {function} props.handleMenu - Function to handle cart menu visibility.
 * @returns {Object} An object with various shopping cart-related functions and data.
 */
export const useAsideCart = ({
  setCountItemProduct = () => { },
  setAlertBox = () => { },
  handleMenu = () => { }
} = {}) => {
  const { handleQuery } = useManageQueryParams()

  const [totalProductPrice, setTotalProductPrice] = useState(0)

  const [dataShoppingCard, { loading }] = useGetCart({ setCountItemProduct })

  // Lógica de transformación de los datos
  const result2 = useMemo(() => {
    if (!loading && dataShoppingCard) {
      return dataShoppingCard.reduce((r, a) => {
        const storeName = a.getStore?.storeName
        if (storeName) {
          r[storeName] = r[storeName] || []
          r[storeName].push(a)
        }
        return r
      }, {})
    }
    return {}
  }, [loading, dataShoppingCard])

  // Obtener dataProduct2 directamente
  const key = useMemo(() => {
    return Object.keys(result2)
  }, [result2])

  useEffect(() => {
    if (dataShoppingCard) {
      let suma = 0
      dataShoppingCard.forEach((a) => {
        const { productFood, cantProducts } = a || {}
        const { ProPrice, ValueDelivery } = productFood || {}
        const PriceFinal = (ProPrice * cantProducts) + ValueDelivery
        suma += PriceFinal
      })
      setTotalProductPrice(Math.abs(suma))
    }
  }, [dataShoppingCard])

  const [deleteOneItem] = useMutation(DELETE_ONE_ITEM_SHOPPING_PRODUCT, {
    onCompleted: data => {
      setAlertBox({ message: data?.deleteOneItem?.message })

      if (dataShoppingCard?.length === 1 && data?.deleteOneItem?.success) {
        setAlertBox({ message: 'Tu carrito está vacío' }) // Ajusta el mensaje en español
        handleMenu(false) // Oculta el menú del carrito
      }
    }
  })

  const handleEditProduct = async (item) => {
    const pId = item?.pId || null
    if (pId) handleQuery('plato', item.pId)
  }
  /**
   * Handle the deletion of a shopping cart item.
   * @param {Object} item - The item to be deleted from the shopping cart.
   */
  const handleDeleteItemShopping = async (item) => {
    try {
      const { cState, ShoppingCard } = item

      await deleteOneItem({
        variables: {
          cState,
          ShoppingCard
        },
        update: (cache, { data }) => {
          const success = data?.deleteOneItem?.success

          if (success && ShoppingCard) {
            cache.modify({
              fields: {
                getAllShoppingCard (existingCart, { readField }) {
                  if (Array.isArray(existingCart) && existingCart.length) {
                    const updatedCart = {
                      ...existingCart,
                      ...existingCart?.filter(product =>
                        readField('ShoppingCard', product) !== ShoppingCard
                      )
                    }
                    if (typeof updatedCart === 'object' && updatedCart !== null) {
                      const newLength = Object.keys(updatedCart)?.length
                      if (updatedCart && newLength) {
                        setCountItemProduct(Object.keys(updatedCart).length)
                      }
                    }
                    return updatedCart
                  } else {
                    return []
                  }
                }
              }
            })
          }
        }
      })
    } catch (error) {
      setAlertBox({ message: 'Error borranto el  item. Por favor intenta nuevamente.', color: 'error' })
    }
  }
  /**
   * Calculate the total price of a product.
   * @param {number} ProPrice - The price of the product.
   * @param {number} ProDelivery - The delivery cost of the product.
   * @param {number} cant - The quantity of the product.
   * @returns {number} The calculated total price.
   */
  const sumProduct = (ProPrice, ProDelivery, cant) => {
    const price = parseInt(ProPrice)
    const priceFinal = cant * price
    const delivery = parseInt(ProDelivery || 0)
    return delivery ? priceFinal + delivery : priceFinal
  }

  return {
    key,
    totalProductPrice,
    result2,
    dataShoppingCard,
    handleDeleteItemShopping,
    handleEditProduct,
    sumProduct
  }
}
