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
/**
 * The `useCart` function is a custom hook in JavaScript that handles the management of a shopping
 * cart, including adding products, managing quantities, and handling optional extras.
 * @param [] - - `openModalProduct`: A boolean indicating whether the modal for the product is open or
 * not. Default value is `false`.
 * @returns The `useCart` function returns an object with the following properties and methods:
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
    const matchingItemInShoppingCartOptional = matchingItemInShoppingCart?.salesExtProductFoodOptional || []
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
      // Filtra y procesa los objetos de optionalFetch
      const filteredDataOptional = optionalFetch
        .map((obj) => {
          const filteredSubOptions = (obj.ExtProductFoodsSubOptionalAll || []).filter(
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

      if (matchingItemInShoppingCartOptional?.length === 0) {
        setDataOptional(filteredDataOptional || [])
      }

      if (matchingItemInShoppingCartOptional?.length) {
        // Actualiza los objetos de filteredDataOptional con información de matchingItemInShoppingCartOptional
        const updateOption = filteredDataOptional?.map((obj) => {
          const matchingArray = matchingItemInShoppingCartOptional?.find(
            (o) => o && o.opExPid === obj.opExPid
          )

          if (!matchingArray) {
            return obj
          }

          // Actualiza las propiedades específicas
          const updatedExtProductFoodsSubOptionalAll = (obj.ExtProductFoodsSubOptionalAll || []).map((subObj) => {
            const newItem = matchingArray.saleExtProductFoodsSubOptionalAll?.find((newItem) => newItem && newItem.opSubExPid === subObj.opSubExPid)

            if (newItem) {
              return {
                ...subObj,
                check: true
              }
            }

            return subObj
          })

          return {
            ...obj,
            ExtProductFoodsSubOptionalAll: updatedExtProductFoodsSubOptionalAll
          }
        }).filter((obj) => obj)

        setDataOptional(updateOption || [])
      }
    }

    const resultExtra = await handleExtProductFoodsAll(pId)
    const originalArray = resultExtra?.data?.ExtProductFoodsAll

    if (Array.isArray(originalArray) && originalArray?.length) {
      const fetchedDataExtra = originalArray?.map(extra => {
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

      setDataExtra(fetchedDataExtra || [])
    }
  }

  /**
   * The function `handleIncrementExtra` updates the quantity and price of a specific extra product in
   * an array based on the provided index and product ID.
   */
  function handleIncrementExtra ({ extra, index }) {
    // Desestructura las propiedades necesarias de dataOneProduct
    const { pId } = dataOneProduct || {}

    // Desestructura exPid de extra o establece un valor predeterminado si no existe
    const { exPid = null } = extra

    if (exPid && pId) {
      const newExtra = dataExtra.map((producto) => {
        if (exPid === producto.exPid) {
          // Desestructura la cantidad y el precio extra del producto o establece valores predeterminados
          const { quantity = 0, extraPrice = 0 } = producto

          // Calcula la nueva cantidad y el nuevo precio extra
          const newQuantity = quantity + 1
          const newExtraPrice = extraPrice * newQuantity

          return {
            ...producto,
            quantity: newQuantity,
            newExtraPrice
          }
        }
        return producto
      })

      // Actualiza el estado de dataExtra con el nuevo array
      setDataExtra(newExtra)
    }
  }

  function handleDecrementExtra ({ extra, index }) {
    // Desestructura las propiedades necesarias de dataOneProduct
    const { pId } = dataOneProduct || {}

    // Desestructura exPid de extra o establece un valor predeterminado si no existe
    const { exPid = null } = extra

    // Encuentra el índice del objeto extra en dataExtra
    const extraIndex = dataExtra.findIndex((item) => item.exPid === exPid)

    if (pId && exPid && extraIndex !== -1) {
      const newExtra = dataExtra.map((producto, i) => {
        if (exPid === producto.exPid) {
          // Desestructura la cantidad y el precio extra del producto o establece valores predeterminados
          const { quantity = 0, extraPrice = 0 } = producto

          // Calcula la nueva cantidad, evitando que sea negativa
          const newQuantity = Math.max(quantity - 1, 0)

          // Calcula el nuevo precio extra
          const newExtraPrice = newQuantity === 0 ? extraPrice : extraPrice * newQuantity

          return {
            ...producto,
            quantity: newQuantity,
            newExtraPrice
          }
        }
        return producto
      })

      // Actualiza el estado de dataExtra con el nuevo array
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

  /**
   * Handles the addition of products to the cart.
   *
   * @param {Object} food - The selected food item.
   */

  const handleAddProducts = async (food) => {
    if (disabled || !food) return
    const idStore = food?.getStore?.idStore
    if (!idStore) {
      return
    }
    handleMenu(1)
    const filteredDataOptional = filterDataOptional(dataOptional)

    const dataExtraFiltered = filterExtra(dataExtra)

    const refCodePid = RandomCode(20)
    const isExistItemInShoppingCart = dataShoppingCard?.find((item) => {
      return item?.productFood && item?.productFood?.pId === food.pId
    }) ?? null

    console.log(isExistItemInShoppingCart)
    const idShoppingCart = isExistItemInShoppingCart?.ShoppingCard
    try {
      const idStore = food?.getStore?.idStore
      const response = await registerShoppingCard({
        variables: {
          input: {
            ShoppingCard: idShoppingCart ?? null,
            cState: 1,
            pId: food.pId,
            idStore,
            refCodePid: idShoppingCart ? null : refCodePid,
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
      setAlertBox({ message: 'Ocurrió un error al añadir el producto al carrito' })
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
