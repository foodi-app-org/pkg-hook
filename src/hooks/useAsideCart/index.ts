import { useMutation } from '@apollo/client'
import {
  useState,
  useEffect,
  useMemo
} from 'react'

import { statusOpenStores } from '../statusOpenStores'
import { useCart, useGetCart } from '../useCart'
import { useManageQueryParams } from '../useManageQueryParams'

import { calculateTotalPrice } from './helpers'
import { DELETE_ONE_ITEM_SHOPPING_PRODUCT } from './queries'


export const useAsideCart = ({
  openModalProduct = false,
  location = {
    pathname: '',
    push: (props, state, { shallow }) => {
      return { ...props, state, shallow }
    },
    query: {
      plato: ''
    }
  },
  setCountItemProduct = (number) => { return number },
  setAlertBox = (args) => { return args },
  setOpenModalProduct = () => { },
  handleMenu = (boolean) => { return boolean }
} = {
  openModalProduct: false,
  location: {
    pathname: '',
    push: (props, state, { shallow }) => {
      return { ...props, state, shallow }
    },
    query: {
      plato: ''
    }
  },
  setCountItemProduct: (number) => { return number },
  setAlertBox: () => { },
  setOpenModalProduct: () => { },
  handleMenu: () => { }
}) => {
  const { getOneProduct } = useCart({
    handleMenu,
    openModalProduct,
    location,
    setOpenModalProduct
  })

  const { handleQuery } = useManageQueryParams({
    location
  })

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
    const totalPrice = calculateTotalPrice(dataShoppingCard)
    setTotalProductPrice(Math.abs(totalPrice))
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
    if (pId) handleQuery('plato', pId)
    if (pId) {
      const product = { pId, intoCart: true }
      getOneProduct(product)
    }
  }
  /**
   * Handle the deletion of a shopping cart item.
   * @param {Object} item - The item to be deleted from the shopping cart.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  const handleDeleteItemShopping = async (item) => {
    if (!item) {
      return setAlertBox({
        message: 'Error borrando el producto. Por favor intenta nuevamente.',
        color: 'error'
      })
    }

    try {
      const { cState, ShoppingCard } = item
      await deleteOneItem({
        variables: { cState, ShoppingCard },
        update: (cache) => {
          cache.modify({
            fields: {
              getAllShoppingCard (existingCart, { readField }) {
                if (!Array.isArray(existingCart)) return []

                const filteredCart = existingCart.filter(product =>
                {return readField('ShoppingCard', product) !== ShoppingCard}
                )

                // Actualizar el contador de productos
                setCountItemProduct(filteredCart.length)

                return filteredCart?.length > 0 ? filteredCart : []
              }
            }
          })
        }
      })
    } catch (error) {
      setAlertBox({ message: 'Error borrando el producto. Por favor intenta nuevamente.', color: 'error' })
    }
  }

  /**
   * Calculate the total price of a product.
   * @param {number} ProPrice - The price of the product.
   * @param {number} ProDelivery - The delivery cost of the product.
   * @param {number} cant - The quantity of the product.
   * @returns {number} The calculated total price.
   */
  const sumProduct = (ProPrice: number, ProDelivery: number, cant: number): number => {
    // Convertir a números, con manejo de posibles errores
    const price = ProPrice
    const delivery = ProDelivery || 0
    const quantity = cant

    // Verificar si las conversiones fueron exitosas
    if (Number.isNaN(price) || Number.isNaN(delivery) || Number.isNaN(quantity)) {
      throw new TypeError('Los valores proporcionados no son números válidos.')
    }

    // Calcular el precio final
    const priceFinal = quantity * price

    // Devolver la suma total, incluyendo el costo de entrega si es aplicable
    return delivery ? priceFinal + delivery : priceFinal
  }

  /**
   * Verifica el estado de apertura de la tienda.
   *
   * @returns {Object|null} Objeto con el estado de apertura de la tienda o null en caso de error.
   * @throws {Error} Si ocurre un error durante la verificación del estado de la tienda.
   */
  const handleVerifyStoreOpenStatus = () => {
  /**
   * @type {Array} dataShoppingCard - El array de la tarjeta de compras.
   */
    if (!Array.isArray(dataShoppingCard)) {
      return { open: false } // Retorna un objeto indicando que la tienda no está abierta
    }

    /**
     * @type {Object} store - La primera tienda en el array de la tarjeta de compras.
     */
    const store = dataShoppingCard[0] || {}
    /**
     * @type {Object} getStore - El objeto que contiene información de la tienda.
     */
    const { getStore } = store

    /**
     * @type {Array} storeSchedules - El array de horarios de la tienda.
     */
    const storeSchedules = Array.isArray(getStore?.getStoreSchedules) ? getStore?.getStoreSchedules : []
    try {
      const status = getStore?.scheduleOpenAll ? { open: true } : statusOpenStores({ dataSchedules: storeSchedules })
      return status
    } catch (error) {
      return null
    }
  }

  return {
    key,
    totalProductPrice,
    result2,
    dataShoppingCard,
    handleDeleteItemShopping,
    handleEditProduct,
    handleVerifyStoreOpenStatus,
    sumProduct
  }
}
