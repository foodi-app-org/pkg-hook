import { useState, useCallback, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import { CREATE_SHOPPING_CARD, GET_ALL_SHOPPING_CARD } from '../queries'
import { RandomCode, updateCacheMod, numberFormat } from '../../../utils'
import { useExtProductFoodsAll, useGetOneProductsFood } from '../../useProductsFood'
import { useGetExtProductFoodsSubOptionalAll } from '../../useGetExtProductFoodsSubOptionalAll'
import { useGetCart } from '../useGetCart'
import { useRouter } from 'next/router'
import {
  filterDataOptional,
  filterExtra,
  validateExtraProducts,
  validateRequirements
} from './helpers'
import { useManageQueryParams } from '../../useManageQueryParams'

/**
 * Custom hook for managing cart functionality.
 *
 * @param {Object} options - Options object.
 * @param {Function} options.setAlertBox - Function to set an alert message.
 * @returns {Object} - Object containing cart state and functions.
 */
export const useCart = ({
  openModalProduct = false,
  handleMenu = () => { },
  setOpenModalProduct = () => { },
  setAlertBox = () => { }
} = {}) => {
  // sub products
  const { handleCleanQuery } = useManageQueryParams()

  const [dataOptional, setDataOptional] = useState([])
  const [dataExtra, setDataExtra] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [comments, setComments] = useState('')
  const location = useRouter()
  const queryParamProduct = location.query.plato
  const [registerShoppingCard] = useMutation(CREATE_SHOPPING_CARD, {
    onError: (error) => {
      console.error('Error registering shopping card:', error)
    }
  })
  // CUSTOM HOOKS
  const [dataShoppingCard, { loading }] = useGetCart()
  const [handleExtProductFoodsAll] = useExtProductFoodsAll()

  const [ExtProductFoodsSubOptionalAll] = useGetExtProductFoodsSubOptionalAll()
  const [dataOneProduct, setDataOneProduct] = useState({})
  const [handleGetOneProduct,
    {
      loading: loadingProduct
    }
  ] = useGetOneProductsFood({ fetchOnlyProduct: true })

  const getOneProduct = async food => {
    const { pId, intoCart } = food || {}
    const isEditing = intoCart
    if (!pId) return {}
    setOpenModalProduct(true)
    const product = await handleGetOneProduct({ variables: { pId } })
    const productFoodsOne = product.data.productFoodsOne || {}
    setDataOneProduct(productFoodsOne)

    const matchingItemInShoppingCart = dataShoppingCard?.find((item) => {
      return item?.productFood && item?.productFood?.pId === pId
    })
    if (matchingItemInShoppingCart && queryParamProduct) {
      setDataOneProduct({
        ...productFoodsOne,
        intoCart: true
      })
      const comments = matchingItemInShoppingCart?.comments
      if (comments) {
        setComments(comments || '')
      }
      const quantityProduct = matchingItemInShoppingCart?.cantProducts
      if (quantityProduct) {
        setQuantity(quantityProduct || 1)
      }
    }
    const optionalAll = await ExtProductFoodsSubOptionalAll({
      variables: { pId }
    })
    const optionalFetch = optionalAll?.data?.ExtProductFoodsOptionalAll
    const shoppingCartOptionalAll = matchingItemInShoppingCart?.ExtProductFoodsAll || []
    if (Array.isArray(optionalFetch)) {
      const filteredDataOptional = optionalFetch
        .map((obj) => {
          const filteredSubOptions =
            (obj.ExtProductFoodsSubOptionalAll || []).filter(
              (subObj) => subObj.check !== false
            )

          if (filteredSubOptions.length === 0) {
            return null
          }

          return {
            ...obj,
            ExtProductFoodsSubOptionalAll: filteredSubOptions
          }
        })
        .filter((obj) => obj !== null)
      setDataOptional(filteredDataOptional || [])
    }

    const resultExtra = await handleExtProductFoodsAll(pId)
    const originalArray = resultExtra?.data?.ExtProductFoodsAll

    if (Array.isArray(originalArray) && originalArray?.length) {
      const fechedDataExtra = originalArray?.map(extra => {
        const updatedExtra = shoppingCartOptionalAll?.find(updatedItem => updatedItem.exPid === extra.exPid)
        if (updatedExtra) {
          return {
            ...extra,
            quantity: updatedExtra?.quantity || 0,
            newExtraPrice: updatedExtra?.newExtraPrice || 0
          }
        }
        return {
          ...extra,
          quantity: 0
        }
      })

      setDataExtra(fechedDataExtra || [])
    }
  }

  function handleIncrementExtra ({ extra, index }) {
    const { pId } = dataOneProduct || {}
    const exPid = extra.exPid || null
    if (exPid && pId) {
      const newExtra = dataExtra.map((producto) => {
        if (exPid === producto.exPid) {
          const initialQuantity = producto?.quantity ? producto?.quantity : 0
          return {
            ...producto,
            quantity: initialQuantity + 1,
            newExtraPrice: producto.extraPrice * (initialQuantity + 1)
          }
        }
        return producto
      })
      return setDataExtra(newExtra)
    }
  }

  function handleDecrementExtra ({ extra, index }) {
    const { pId } = dataOneProduct || {}
    const exPid = extra.exPid || null

    // Comprobar que el objeto extra existe en dataExtra
    const extraIndex = dataExtra.findIndex((extra) => extra.exPid === exPid)
    if (extraIndex === -1) {
      return
    }

    if (pId && exPid) {
      const newExtra = dataExtra.map((producto, i) => {
        if (exPid === producto.exPid) {
          const initialQuantity = producto?.quantity
          const newQuantity = Math.max(initialQuantity - 1, 0) // Evitar que el quantity sea negativo
          const newExtraPrice = newQuantity === 0 ? producto.extraPrice : producto.extraPrice * newQuantity
          return {
            ...producto,
            quantity: newQuantity,
            newExtraPrice
          }
        }
        return producto
      })
      setDataExtra(newExtra)
    }
  }

  const handleIncrease = () => {
    return setQuantity((prev) => { return prev + 1 })
  }

  const handleDecrease = () => {
    return setQuantity((prev) => { return prev - 1 })
  }

  const handleCountProducts = useCallback((ProPrice, quantity) => {
    if (!ProPrice || !quantity) {
      return 0 // Manejo de valores nulos o no numéricos
    }

    const price = parseFloat(ProPrice)
    const numericQuantity = parseInt(quantity, 10)

    if (isNaN(price) || isNaN(numericQuantity)) {
      return 0 // Manejo de valores no numéricos
    }

    if (numericQuantity <= 0 || price <= 0) {
      return price // Manejo de cantidades o precios no positivos
    }

    const totalPrice = Math.abs(numericQuantity * price)
    return numberFormat(totalPrice) // Si es necesario, aplicar formateo aquí
  }, [dataOneProduct])

  const handleAddOptional = ({ exOptional = null, codeCategory = null }) => {
    if (!exOptional || !codeCategory) return
    const item = dataOptional.find((item) => item.code === codeCategory)
    if (!item) return
    const idx = item.ExtProductFoodsSubOptionalAll.findIndex(
      (el) => el.opSubExPid === exOptional
    )
    if (item && idx !== -1) {
      const updatedItem = {
        ...item,
        ExtProductFoodsSubOptionalAll: [
          ...item.ExtProductFoodsSubOptionalAll.slice(0, idx),
          {
            ...item.ExtProductFoodsSubOptionalAll[idx],
            check: !item.ExtProductFoodsSubOptionalAll[idx].check
          },
          ...item.ExtProductFoodsSubOptionalAll.slice(idx + 1)
        ]
      }
      const newData = dataOptional.map((el) =>
        el.code === codeCategory ? updatedItem : el
      )
      setDataOptional((prevData) => [...newData])
    }
  }

  const isValidDataExtra = (!dataExtra.length && !dataOneProduct?.pId) ? false : !validateExtraProducts(dataExtra)

  const isValid = (!dataOptional.length && !dataOneProduct?.pId) ? false : validateRequirements(dataOptional)

  const disabled = isValid || isValidDataExtra

  const forceOpen = false
  /**
   * Handles the addition of products to the cart.
   *
   * @param {Object} food - The selected food item.
   */

  const handleAddProducts = async (food) => {
    if (disabled) return
    const idStore = food?.getStore?.idStore
    if (!idStore) {
      return
    }
    handleMenu(1, forceOpen)
    const filteredDataOptional = filterDataOptional(dataOptional)

    const dataExtraFiltered = filterExtra(dataExtra)

    const refCodePid = RandomCode(20)

    try {
      const idStore = food?.getStore?.idStore
      const response = await registerShoppingCard({
        variables: {
          input: {
            cState: 1,
            pId: food.pId,
            idStore,
            refCodePid,
            comments,
            cName: '',
            cantProducts: quantity,
            csDescription: '',
            dataExtra: dataExtraFiltered || [],
            dataOptional: filteredDataOptional || []
          },
          idSubArray: {
            setID: []
          }
        },
        update: (cache, { data: { getAllShoppingCard } }) => {
          return updateCacheMod({
            cache,
            query: GET_ALL_SHOPPING_CARD,
            nameFun: 'getAllShoppingCard',
            dataNew: getAllShoppingCard
          })
        }
      })

      if (response?.data) {
        // Perform actions after adding products to cart
      }
    } catch (error) {
      setAlertBox({ message: 'Ocurrio un error al añadir el producto al carrito' })
    }
  }

  const handleShowModalProduct = () => {
    if (openModalProduct) {
      setDataExtra([])
      setDataOneProduct({})
      setQuantity(1)
      setComments('')
      setDataOptional([])
    }
    if (queryParamProduct && openModalProduct) {
      handleCleanQuery('plato')
    }
    return setOpenModalProduct(!openModalProduct)
  }

  useEffect(() => {
    if (queryParamProduct) {
      const product = { pId: queryParamProduct }
      getOneProduct(product)
    }
  }, [queryParamProduct])

  return {
    quantity,
    disabled,
    comments,
    loading: loadingProduct || loading,
    dataOneProduct,
    dataExtra,
    dataOptional,
    setQuantity,
    handleShowModalProduct,
    handleDecrease,
    handleIncrease,
    getOneProduct,
    handleIncrementExtra,
    handleDecrementExtra,
    handleAddOptional,
    setComments,
    handleCountProducts,
    handleAddProducts
  }
}
