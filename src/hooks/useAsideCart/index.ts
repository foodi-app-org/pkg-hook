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


type LocationType = {
  pathname: string
  push: (url: string) => void
  query: { plato: string }
}
type UseAsideCartProps = {
  openModalProduct?: boolean
  location?: LocationType
  setCountItemProduct?: (count: number) => void
  setAlertBox?: (args: any) => void
  setOpenModalProduct?: (open: boolean) => void
  handleMenu?: (open: boolean) => void
}

const defaultLocation: LocationType = {
  pathname: '',
  push: () => { },
  query: { plato: '' }
}

export const useAsideCart = ({
  openModalProduct = false,
  location = defaultLocation,
  setCountItemProduct = () => { },
  setAlertBox = () => { },
  setOpenModalProduct = () => { },
  handleMenu = () => { }
}: UseAsideCartProps = {}) => {
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
  
   
  const [dataShoppingCard, { loading }] = useGetCart({ setCountItemProduct: (count: number) => setCountItemProduct(count) })

  // Lógica de transformación de los datos
  const result2 = useMemo(() => {
    if (!loading && dataShoppingCard) {
      return (dataShoppingCard.reduce((r: Record<string, any[]>, a: any) => {
        const storeName = a.getStore?.storeName
        if (storeName) {
          r[storeName] = r[storeName] || []
          r[storeName].push(a)
        }
        return r
      }, {}) as Record<string, any[]>)
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

  const handleEditProduct = async (item: any) => {
    const pId = item?.pId || null
    if (pId) handleQuery('plato', pId)
    if (pId) {
      const product = { pId, intoCart: true }
      getOneProduct(product)
    }
  }
  /**
   * Handle the deletion of a shopping cart item.
   * @param item
   */
  const handleDeleteItemShopping = async (item: any): Promise<void> => {
    if (!item) {
      setAlertBox({
        message: 'Error borrando el producto. Por favor intenta nuevamente.',
        color: 'error'
      })
      return
    }

    try {
      const { cState, ShoppingCard } = item
      await deleteOneItem({
        variables: { cState, ShoppingCard },
        update: (cache) => {
          cache.modify({
            fields: {
              getAllShoppingCard(
                args: { readField: (field: string, item: any) => any },
                existingCart: readonly (import('@apollo/client').Reference | import('@apollo/client').StoreObject)[] = []
              ) {
                if (!Array.isArray(existingCart)) return [];
                const { readField } = args;

                // Reduce nesting by extracting logic
                const filterCart = (cart: readonly (import('@apollo/client').Reference | import('@apollo/client').StoreObject)[]) => {
                  const filteredCart = cart.filter(product =>
                    readField('ShoppingCard', product) !== ShoppingCard
                  );
                  setCountItemProduct(filteredCart.length);
                  return filteredCart.length > 0 ? filteredCart : [];
                };

                return filterCart(existingCart);
              }
            }
          })
        }
      })
    } catch (error) {
      // Rethrow or handle as needed, here we log and rethrow
      setAlertBox({ message: 'Error borrando el producto. Por favor intenta nuevamente.', color: 'error' })
      throw error
    }
  }

  /**
   * Calculate the total price of a product.
   * @param ProPrice
   * @param ProDelivery
   * @param cant
   * @returns {number} The total price including delivery.
   */
  const sumProduct = (ProPrice: number, ProDelivery: number, cant: number): number => {
    const price = ProPrice
    const delivery = ProDelivery || 0
    const quantity = cant

    if (Number.isNaN(price) || Number.isNaN(delivery) || Number.isNaN(quantity)) {
      throw new TypeError('Los valores proporcionados no son números válidos.')
    }

    const priceFinal = quantity * price

    return delivery ? priceFinal + delivery : priceFinal
  }

  /**
   * Verifica el estado de apertura de la tienda.
   * @returns {{ open: boolean } | null} El estado de apertura de la tienda.
   */
  const handleVerifyStoreOpenStatus = (): { open: boolean } | null => {
    if (!Array.isArray(dataShoppingCard)) {
      return { open: false }
    }

    const store = dataShoppingCard[0] || {}
    const { getStore } = store

    const storeSchedules = Array.isArray(getStore?.getStoreSchedules) ? getStore?.getStoreSchedules : []
    try {
      const status = getStore?.scheduleOpenAll ? { open: true } : statusOpenStores({ dataSchedules: storeSchedules })
      return status
    } catch (error) {
      // Rethrow or handle as needed, here we log and rethrow
      // console.error(error)
      if (error instanceof Error) {
        setAlertBox({ message: error.message, color: 'error' })
      }
      throw error
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
