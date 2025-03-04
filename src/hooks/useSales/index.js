import {
  useApolloClient,
  useLazyQuery,
  useMutation
} from '@apollo/client'
import {
  useCallback,
  useEffect,
  useReducer,
  useMemo,
  useState
} from 'react'
import { Cookies } from '../../cookies'
import { RandomCode, getCurrentDomain } from '../../utils'
import { useFormatDate } from '../useFormatDate'
import { useProductsFood } from '../useProductsFood'
import {
  GET_ALL_EXTRA_PRODUCT,
  GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
  GET_ONE_PRODUCTS_FOOD
} from '../useProductsFood/queriesStore'
import { useStore } from '../useStore'
import {
  CREATE_SHOPPING_CARD_TO_USER_STORE,
  GET_ALL_COUNT_SALES
} from './queries'
import { updateExistingOrders } from '../useUpdateExistingOrders'
import { useGetSale } from './useGetSale'
import { useCatWithProduct } from './../useCatWithProduct/index'
import { useLogout } from '../useLogout'
import { filterProductsByCarProId, removeFunc } from './helpers'
export * from './useGetAllSales'
export * from './helpers'

export { GET_ALL_COUNT_SALES } from './queries'

export const initialState = {
  PRODUCT: [],
  totalPrice: 0,
  sortBy: null,
  itemsInCart: 0,
  animateType: '',
  startAnimateUp: '',
  priceRange: 0,
  counter: 0,
  totalAmount: 0,
  payMethodPState: 0
}

export const initializer = (initialValue = initialState) => {
  return (
    JSON.parse(
      // @ts-ignore
      Cookies.get(process.env.LOCAL_SALES_STORE) || JSON.stringify(initialState)
    ) || initialValue
  )
}

export const useSales = ({
  disabled = false,
  router,
  sendNotification = (args) => { return args },
  setAlertBox = (args) => { return args }
}) => {
  const domain = getCurrentDomain()
  const [loadingSale, setLoadingSale] = useState(false)
  const [errorSale, setErrorSale] = useState(false)
  const [onClickLogout] = useLogout({})

  const [modalItem, setModalItem] = useState(false)
  const [openCommentModal, setOpenCommentModal] = useState(false)
  const keyToSaveData = process.env.LOCAL_SALES_STORE
  // @ts-ignore
  const saveDataState = JSON.parse(Cookies.get(keyToSaveData) || '[]')
  const [search, setSearch] = useState('')
  const [datCat] = useCatWithProduct({})
  const [categories, setCategories] = useState([])
  useEffect(() => {
    setCategories(datCat)
  }, [datCat])
  const [totalProductPrice, setTotalProductPrice] = useState(0)
  const [showMore, setShowMore] = useState(100)
  const [inputValue, setInputValue] = useState('')
  // eslint-disable-next-line no-unused-vars
  const [_, setFilteredList] = useState([])
  const [delivery, setDelivery] = useState(false)
  const [print, setPrint] = useState(false)
  const [errors, setErrors] = useState({})
  const [values, setValues] = useState({
    comment: '',
    change: '',
    cliId: '',
    valueDelivery: ''
  })
  const [dataStore] = useStore()
  const { createdAt } = dataStore || {}
  const [code, setCode] = useState(null)
  const [openCurrentSale, setOpenCurrentSale] = useState(null)
  const [oneProductToComment, setOneProductToComment] = useState({})
  const [sumExtraProducts, setSumExtraProducts] = useState(0)
  const { yearMonthDay } = useFormatDate({ date: createdAt })
  const [valuesDates, setValuesDates] = useState(() => {
    return { fromDate: yearMonthDay, toDate: '' }
  })
  const [loadingExtraProduct, setLoadingExtraProduct] = useState(false)
  const [dataOptional, setDataOptional] = useState([])
  const [dataExtra, setDataExtra] = useState([])
  const [registerSalesStore, { loading: loadingRegisterSale }] = useMutation(
    CREATE_SHOPPING_CARD_TO_USER_STORE,
    {
      onCompleted: (data) => {
        const message = `${data?.registerSalesStore?.Response?.message}`
        const error = data?.registerSalesStore?.Response.success
          ? 'Éxito'
          : 'Error'
        sendNotification({
          backgroundColor: error ? 'success' : 'error',
          title: error,
          description: message
        })
        setAlertBox({ message, type: 'success' })
        if (message === 'Token expired') {
          // @ts-ignore
          onClickLogout()
        }
        setOpenCurrentSale(data?.registerSalesStore?.Response.success)
      },
      onError: (error) => {
        sendNotification({
          backgroundColor: 'error',
          title: error || 'Lo sentimos',
          description: 'ha ocurrido un error'
        })
      }
    }
  )
  const [product, setProduct] = useState({
    PRODUCT: {}
  })
  const [productFoodsOne, { data: dataProduct }] = useLazyQuery(
    GET_ONE_PRODUCTS_FOOD
  )
  const [ExtProductFoodsSubOptionalAll, { loading: loadingExtProductFoodsSubOptionalAll }] = useLazyQuery(
    GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
    {
      onError: () => {
        setDataOptional([])
      }
    }
  )
  const [ExtProductFoodsAll] = useLazyQuery(GET_ALL_EXTRA_PRODUCT, {
    onError: () => {
      setDataExtra([])
    }
  })
  const [productsFood, { loading, fetchMore }] = useProductsFood({
    // @ts-ignore
    search: search?.length >= 4 ? search : '',
    gender: [],
    desc: [],
    categories: [],
    toDate: valuesDates?.toDate,
    fromDate: valuesDates?.fromDate,
    max: showMore,
    min: 0
  })
  const handleChangeCheck = (caId) => {
    // @ts-ignore
    setCategories((prev) => {
      return prev.map((item) => {
        // @ts-ignore
        return item.carProId === caId
          // @ts-ignore
          ? { ...item, checked: !item?.checked }
          : item
      })
    })
  }

  const max = productsFood?.reduce(function (a, b) {
    return Math.max(a, b?.ProPrice || 0)
  }, 0)
  const initialStateSales = {
    PRODUCT: [],
    totalPrice: 0,
    sortBy: null,
    itemsInCart: 0,
    animateType: '',
    startAnimateUp: '',
    priceRange: max || 0,
    counter: 0,
    totalAmount: 0,
    payMethodPState: 0
  }
  // HANDLESS
  // FILTER PRODUCT DATA_DB
  // @ts-ignore
  const handlePrint = () => {
    if (disabled) {
      return sendNotification({
        title: 'Error',
        description: 'Esta es la descripción',
        backgroundColor: 'error'
      })
    }
    setPrint(!print)
  }
  const handleChangeFilter = (e) => {
    return setSearch(e.target.value)
  }
  const handleChange = (e, error) => {
    const { name, value } = e.target
    setErrors({ ...errors, [e.target.name]: error })
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value
    }))
  }
  const onChangeInput = (e) => {
    return setValuesDates({ ...valuesDates, [e.target.name]: e.target.value })
  }
  const handleToggleEditingStatus = (state, action) => {
    const { PRODUCT } = state ?? {
      PRODUCT: []
    }
    return {
      ...state,
      PRODUCT: PRODUCT.map((item) => {
        if (item.pId === action.payload.pId) {
          return {
            ...item,
            editing: !item.editing,
            oldQuantity: item.ProQuantity
          }
        }
        return item
      })
    }
  }

  const handleChangeFilterProduct = (e) => {
    const text = searchedInput(e.target.value)
    if (text === undefined || text === '') {
      return
    }
    const filteredData = handleList(text)
    setFilteredList(filteredData)
  }
  const handleComment = (product) => {
    if (product) {
      setOneProductToComment(product)
      setValues({
        ...values,
        comment: product?.comment ?? ''
      })
    }
    setOpenCommentModal(!openCommentModal)
  }
  const handleSuccessUpdateQuantity = (state, payload) => {
    const { pId } = payload.payload || {
      pId: null
    }
    return {
      ...state,
      PRODUCT: state?.PRODUCT?.map((items) => {
        return items.pId === pId
          ? {
              ...items,
              editing: false,
              oldQuantity: items.ProQuantity
            }
          : items
      })
    }
  }

  /**
 * Cancels the update of a product's quantity, resetting it to the previous value.
 * @param {Object} state - The current state.
 * @param {Object} payload - The payload containing the product ID.
 * @returns {Object} - The new state with the updated product quantity and editing status.
 */
  const handleCancelUpdateQuantity = (state, payload) => {
    // Validación de `state`
    if (!state || typeof state !== 'object') {
      sendNotification({
        title: 'Error',
        backgroundColor: 'error',
        description: 'Ha ocurrido un error al actualizar la cantidad del producto.'
      })
      return state // Retorna el estado sin cambios si es inválido.
    }

    // Validación de `PRODUCT`
    if (!Array.isArray(state.PRODUCT)) {
      sendNotification({
        title: 'Error',
        backgroundColor: 'error',
        description: 'Ha ocurrido un error al actualizar la cantidad del producto.'
      })
      return state // Retorna el estado sin cambios si `PRODUCT` no es un array.
    }

    // Validación de `payload`
    const { pId } = payload.payload || {}
    if (!pId) {
      sendNotification({
        title: 'Error',
        backgroundColor: 'error',
        description: 'Ha ocurrido un error al actualizar la cantidad del producto.'
      })
      return state // Retorna el estado sin cambios si falta `pId`.
    }

    return {
      ...state,
      PRODUCT: state.PRODUCT.map((item) => {
        // Validación de propiedades en cada item
        if (item.pId === pId) {
          if (typeof item.oldQuantity !== 'number' || typeof item.unitPrice !== 'number') {
            sendNotification({
              title: 'Error',
              backgroundColor: 'error',
              description: 'Ha ocurrido un error al actualizar la cantidad del producto.'
            })
            return item // Retorna el item sin cambios si las propiedades son inválidas.
          }

          return {
            ...item,
            editing: false,
            ProQuantity: item.oldQuantity,
            ProPrice: item.oldQuantity * item.unitPrice
          }
        }

        return item
      })
    }
  }

  const handleChangeNumber = useCallback(
    (state, action) => {
      const event = action.payload
      const { value, index, id } = event || {}

      const productExist = productsFood?.find((items) => items.pId === id)
      const OneProduct = state?.PRODUCT.find((items) => items.pId === id)

      if (!productExist) return state // Validar si el producto existe

      // Validar si el stock es 0
      if (productExist.stock === 0) {
        sendNotification({
          title: 'Sin stock',
          backgroundColor: 'warning',
          description: `El producto ${OneProduct?.pName} está agotado y no puede ser modificado.`
        })
        return state
      }

      // Si el valor ingresado es menor o igual a 0, eliminar el producto del carrito
      if (value <= 0) {
        dispatch({ type: 'REMOVE_PRODUCT_TO_CART', payload: OneProduct })
        return state
      }

      // Validar si se intenta superar el stock disponible
      const finalQuantity = Math.min(value, productExist.stock)
      if (value > productExist.stock) {
        sendNotification({
          title: 'Stock insuficiente',
          backgroundColor: 'warning',
          description: `No puedes agregar más unidades de ${OneProduct?.pName}, stock disponible: ${productExist.stock}`
        })
      }

      const ARR_PRODUCT = state?.PRODUCT?.map((items, i) =>
        i === index
          ? {
              ...items,
              ProQuantity: finalQuantity,
              ProPrice: finalQuantity * productExist?.ProPrice
            }
          : items
      )

      return {
        ...state,
        PRODUCT: ARR_PRODUCT,
        counter: state.counter + 1
      }
    },
    [productsFood]
  )

  const paymentMethod = (state, action) => {
    return {
      ...state,
      payMethodPState: action.payload
    }
  }
  const PRODUCT = (state, action) => {
    switch (action.type) {
      case 'ADD_TO_CART':
        return addToCartFunc(state, action) // https://www.npmjs.com/package/@sourcetoad/vision-camera-plugin-barcode-scanner
      case 'ADD_PRODUCT':
        return {
          ...state,
          // eslint-disable-next-line
          PRODUCT: [...state?.PRODUCT, action?.payload],
        }
      case 'REMOVE_PRODUCT':
        return removeFunc(state, action, productsFood)
      case 'REMOVE_PRODUCT_TO_CART':
        return {
          ...state,
          PRODUCT: state?.PRODUCT?.filter((t) => {
            return t.pId !== action?.payload.pId
          }),
          counter: state.counter - action.payload.ProQuantity
        }
      case 'ON_CHANGE': {
        return handleChangeNumber(state, action)
      }
      case 'UPDATE_SUCCESS_QUANTITY_EDITING_PRODUCT': {
        return handleSuccessUpdateQuantity(state, action)
      }
      case 'CANCEL_UPDATE_QUANTITY_EDITING_PRODUCT': {
        return handleCancelUpdateQuantity(state, action)
      }
      case 'REMOVE_ALL_PRODUCTS':
        // @ts-ignore
        setValues({
          ...values,
          comment: '',
          change: '',
          valueDelivery: ''
        })
        return {
          ...state,
          PRODUCT: [],
          sortBy: null,
          counter: 0
        }

      case 'TOGGLE_FREE_PRODUCT':
        return toggleFreeProducts(state, action)
      case 'TOGGLE_EDITING_PRODUCT': {
        return handleToggleEditingStatus(state, action)
      }
      case 'INCREMENT': {
        return {
          ...state,
          counter: state.counter + 1,
          PRODUCT: state?.PRODUCT?.map((items) => {
            if (items.pId === action.id) {
              const OurProduct = productsFood?.find((item) => item.pId === action.id)
              const isFree = items.free
              const newQuantity = items.ProQuantity + 1
              // Validar si el stock es 0
              if (OurProduct?.stock === 0) {
                sendNotification({
                  title: 'Sin stock',
                  backgroundColor: 'warning',
                  description: `El producto ${items.pName} está agotado y no puede ser añadido al carrito.`
                })
                return items // Retornar sin modificar
              }

              // Validar si se supera el stock
              if (newQuantity > OurProduct?.stock) {
                sendNotification({
                  title: 'Stock insuficiente',
                  backgroundColor: 'warning',
                  description: `No puedes agregar más unidades de ${items.pName}, stock disponible: ${OurProduct?.stock}`
                })
                return items // Retornar el producto sin modificar
              }

              return {
                ...items,
                ProQuantity: newQuantity,
                ProPrice: isFree ? 0 : newQuantity * OurProduct?.ProPrice
              }
            }
            return items
          })
        }
      }

      case 'PUT_COMMENT':
        return commentProducts(state, action)
      case 'PUT_EXTRA_PRODUCTS_AND_OPTIONAL_PRODUCT':
        return handleUpdateAllExtraAndOptional(state, action)
      case 'PRICE_RANGE':
        return {
          ...state,
          priceRange: action.payload
        }
      case 'SORT':
        return { ...state, sortBy: action.payload }
      case 'DECREMENT':
        return {
          ...state
        }
      case 'PAYMENT_METHOD': return paymentMethod(state, action)

      default:
        return state
    }
  }
  const [data, dispatch] = useReducer(PRODUCT, initialStateSales, initializer)

  const handleRemoveValue = useCallback(({ name, value, pId }) => {
    setValues({
      ...values,
      [name]: value ?? ''
    })
    sendNotification({
      backgroundColor: 'sucess',
      title: 'Comentario eliminado',
      description: 'Has eliminado el comentario!'
    })
    // @ts-ignore
    return dispatch({
      type: 'PUT_COMMENT',
      payload: pId,
      value: ''
    })
  }, [])
  useEffect(() => {
    // @ts-ignore
    Cookies.set(keyToSaveData, JSON.stringify(data), { domain, path: '/' })
  }, [data, domain])

  const handleAddOptional = ({ exOptional = null, codeCategory = null }) => {
    if (!exOptional || !codeCategory) return
    // @ts-ignore
    const item = dataOptional.find((item) => item.code === codeCategory)
    if (!item) return
    // @ts-ignore
    const idx = item.ExtProductFoodsSubOptionalAll.findIndex(
      (el) => el.opSubExPid === exOptional
    )
    if (item && idx !== -1) {
      const updatedItem = {
        // @ts-ignore
        ...item,
        ExtProductFoodsSubOptionalAll: [
          // @ts-ignore
          ...item.ExtProductFoodsSubOptionalAll.slice(0, idx),
          {
            // @ts-ignore
            ...item.ExtProductFoodsSubOptionalAll[idx],
            // @ts-ignore
            check: !item.ExtProductFoodsSubOptionalAll[idx].check
          },
          // @ts-ignore
          ...item.ExtProductFoodsSubOptionalAll.slice(idx + 1)
        ]
      }
      const newData = dataOptional.map((el) =>
        // @ts-ignore
        el.code === codeCategory ? updatedItem : el
      )
      // @ts-ignore
      setDataOptional(() => [...newData])
    }
  }

  function handleUpdateAllExtraAndOptional (state, action) {
    return {
      ...state,
      PRODUCT: state?.PRODUCT?.map((items) => {
        return items.pId === action.payload
          ? {
              ...items,
              dataOptional: action.dataOptional || [],
              dataExtra: action.dataExtra || []
            }
          : items
      })
    }
  }

  /**
   * Description
   * @returns {any}
   *  */
  useEffect(() => {
    const arr =
      dataExtra?.length > 0
        ? dataExtra?.filter((p) => {
          // @ts-ignore
          return p.quantity !== 0
        })
        : []
    const val = arr.findIndex((item) => item.quantity !== 0)
    if (val === -1) {
      setSumExtraProducts(0)
    }
    function sumNewExtraPrice () {
      let sum = 0
      arr.forEach((obj) => {
        sum += obj.newExtraPrice ?? 0
      })
      if (arr.length === 0) {
        setSumExtraProducts(0)
      }
      setSumExtraProducts(sum)
      return sum
    }
    if (arr.length > 0) {
      sumNewExtraPrice()
    }
  }, [dataExtra])

  function handleUpdateAllExtra () {
    try {
      if (!product?.PRODUCT?.pId) {
        return sendNotification({
          title: 'Error',
          backgroundColor: 'error',
          description: 'Ha ocurrido un error'
        })
      }
      const filteredDataOptional = dataOptional
        .map((obj) => {
          // @ts-ignore
          const filteredSubOptions = obj?.ExtProductFoodsSubOptionalAll?.filter(
            (subObj) => subObj?.check === true
          )
          // Excluya todo el objeto padre si filteredSubOptions está vacío
          if (filteredSubOptions?.length === 0) {
            return null
          }
          // @ts-ignore
          return { ...obj, ExtProductFoodsSubOptionalAll: filteredSubOptions }
        })
        .filter((obj) => obj !== null) // Elimine todos los objetos nulos del arreglo
      // @ts-ignore
      const filteredDataExtra = dataExtra?.filter((p) => p?.quantity !== undefined && p?.quantity !== 0)
      if (product?.PRODUCT?.pId) {
        // @ts-ignore
        dispatch({
          type: 'PUT_EXTRA_PRODUCTS_AND_OPTIONAL_PRODUCT',
          payload: product.PRODUCT.pId,
          dataOptional: filteredDataOptional,
          dataExtra: filteredDataExtra
        })
        const updatesOccurred = (
          (dataExtra && dataExtra.length > 0)
        )
        if (updatesOccurred) {
          return sendNotification({
            title: 'Success',
            backgroundColor: 'success',
            description: 'Items subidos al producto'
          })
        }
      }
    } catch (_error) {
      return sendNotification({
        title: 'Error',
        backgroundColor: 'error',
        description: 'No se puedo actualizar el producto'
      })
    }
  }

  // @ts-ignore
  function handleIncrementExtra ({ Adicionales, index }) {
    const { pId } = product?.PRODUCT || {}
    const exPid = Adicionales?.exPid || null

    if (exPid && pId) {
      const newExtra = dataExtra.map((producto) => {
        // @ts-ignore
        if (exPid === producto.exPid) {
          // @ts-ignore
          const initialQuantity = producto?.quantity ? producto?.quantity : 0
          const newQuantity = initialQuantity + 1
          // @ts-ignore
          const newExtraPrice = producto.extraPrice * newQuantity

          return {
            // @ts-ignore
            ...producto,
            quantity: newQuantity,
            newExtraPrice
          }
        }
        return producto
      })

      // @ts-ignore
      setDataExtra(newExtra)
    }
  }

  // @ts-ignore
  function handleDecrementExtra ({ Adicionales, index }) {
    const { pId } = product?.PRODUCT || {}
    const exPid = Adicionales?.exPid || null

    // Comprobar que el objeto Adicionales existe en dataExtra
    // @ts-ignore
    const extraIndex = dataExtra.findIndex((extra) => extra.exPid === exPid)
    if (extraIndex === -1) {
      return
    }

    if (pId && exPid && extraIndex !== -1) {
      // @ts-ignore
      const newExtra = dataExtra.map((producto, i) => {
        // @ts-ignore
        if (exPid === producto.exPid) {
          // Desestructura la cantidad y el precio extra del producto o establece valores predeterminados
          const { quantity = 0, extraPrice = 0 } = producto

          // Calcula la nueva cantidad, evitando que sea negativa
          const newQuantity = Math.max(quantity - 1, 0)

          // Calcula el nuevo precio extra
          const newExtraPrice = newQuantity === 0 ? extraPrice : extraPrice * newQuantity

          return {
            // @ts-ignore
            ...producto,
            quantity: newQuantity,
            newExtraPrice
          }
        }
        return producto
      })

      // Actualiza el estado de dataExtra con el nuevo array
      // @ts-ignore
      setDataExtra(newExtra)
    }
  }

  function isStockInsufficient (currentQuantity, stock) {
    return currentQuantity >= stock
  }

  function sendAlertStock (stock) {
    return sendNotification({
      title: 'Stock insuficiente',
      backgroundColor: 'warning',
      description: `Solo hay ${stock} unidades disponibles en el inventario`
    })
  }

  function addToCartFunc (state, action) {
    const {
      pId,
      pName,
      getOneTags,
      stock,
      ProDescription,
      ProImage,
      ProPrice
    } = action.payload ?? {}
    if (stock === 0) {
      sendNotification({
        title: 'Sin stock',
        backgroundColor: 'warning',
        description: 'Producto sin stock disponible  en tu inventario'
      })
      return state
    }

    const productExist = state?.PRODUCT.find((item) => item.pId === pId)
    const OurProduct = productsFood?.find((item) => item.pId === pId)
    const isFree = productExist?.free
    const currentQuantity = productExist?.ProQuantity || 0
    console.log('currentQuantity', productExist)
    if (productExist?.manageStock && isStockInsufficient(currentQuantity, stock)) {
      sendAlertStock(stock)
      return state
    }

    const updatedProduct = {
      pId,
      pName,
      editing: false,
      getOneTags,
      unitPrice: OurProduct?.ProPrice,
      manageStock: OurProduct?.manageStock ?? false,
      ProDescription,
      ProImage,
      ProPrice,
      stock,
      ProQuantity: 1
    }

    if (!productExist) {
      return {
        ...state,
        counter: state.counter + 1,
        totalAmount: state.totalAmount + ProPrice,
        startAnimateUp: 'start-animate-up',
        PRODUCT: [...state.PRODUCT, updatedProduct]
      }
    }
    return {
      ...state,
      counter: state.counter + 1,
      totalAmount: state.totalAmount + ProPrice,
      startAnimateUp: 'start-animate-up',
      PRODUCT: state.PRODUCT.map((item) => {
        if (item.pId === pId) {
          return {
            ...item,
            getOneTags: OurProduct?.genderTags,
            unitPrice: OurProduct?.ProPrice,
            editing: false,
            oldQuantity: productExist.ProQuantity + +1,
            ProPrice: isFree ? 0 : (productExist.ProQuantity + 1) * OurProduct?.ProPrice,
            ProQuantity: productExist.ProQuantity + +1,
            free: !!isFree
          }
        }
        return item
      })
    }
  }

  // TOGGLE_FREE_PRODUCT
  function toggleFreeProducts (state, action) {
    const productExist = productsFood.find((items) => {
      return items.pId === action.payload.pId
    })
    return {
      ...state,
      PRODUCT: state?.PRODUCT?.map((items) => {
        return items.pId === action.payload.pId
          ? {
              ...items,
              free: !items.free,
              ProPrice: items.ProPrice
                ? 0
                : items.ProQuantity * productExist?.ProPrice
            }
          : items
      })
    }
  }

  // COMMENT_FREE_PRODUCT
  function commentProducts (state, action, deleteValue) {
    if (values.comment) {
      sendNotification({
        backgroundColor: 'success',
        title: deleteValue ? 'Comentario eliminado' : 'Producto comentado',
        description: deleteValue ? 'Has eliminado el comentario!' : 'Has comentado!'
      })
    }
    setOpenCommentModal(!openCommentModal)
    return {
      ...state,
      PRODUCT: state?.PRODUCT?.map((items) => {
        return items.pId === action.payload
          ? {
              ...items,
              comment: deleteValue ? '' : values.comment
            }
          : items
      })
    }
  }

  const getSortedProduct = useCallback((data, sort) => {
    if (sort && sort === 'PRICE_HIGH_TO_LOW') {
      return data.sort((a, b) => {
        return b.ProPrice - a.ProPrice
      })
    }
    if (sort && sort === 'PRICE_LOW_TO_HIGH') {
      return data.sort((a, b) => {
        return a.ProPrice - b.ProPrice
      })
    }
    return data
  }, [])

  const PriceRangeFunc = (products, price) => {
    return (
      products?.length > 0 &&
      products?.filter((items) => {
        return items?.ProPrice >= price
      })
    )
  }

  const sortedProduct = useMemo(() => {
    return getSortedProduct(data.PRODUCT, data.sortBy)
  }, [data.PRODUCT, data.sortBy, getSortedProduct])

  const finalFilter = PriceRangeFunc(sortedProduct, data.priceRange)

  const handleList = (text) => {
    const inputText = text.toLowerCase()
    let dataList = []
    dataList = finalFilter.filter((item) => {
      return item.pName.toLowerCase().includes(inputText)
    })
    return dataList
  }
  const searchedInput = (words) => {
    setInputValue(words)
    const n = words.split(' ')
    if (n.length !== 0) {
      if (n[n.length - 1] === '') {
        n.pop()
      }
      return n[n.length - 1]
    }
    return ''
  }
  const arrayProduct = data?.PRODUCT?.length > 0
    ? data?.PRODUCT?.map((product) => {
      const filteredDataExtra =
        product?.dataExtra?.map(({ __typename, ...rest }) => rest) ?? []
      const dataOptional = product?.dataOptional?.map(
        ({ __typename, ...product }) => {
          const { ExtProductFoodsSubOptionalAll, ...rest } = product
          const adjustedSubOptionalAll = ExtProductFoodsSubOptionalAll?.map(
            (subOption) => {
              const { __typename, ...subOptionRest } = subOption
              return subOptionRest
            }
          )
          return {
            ...rest,
            ExtProductFoodsSubOptionalAll: adjustedSubOptionalAll
          }
        }
      )
      const refCodePid = RandomCode(20)
      return {
        pId: product?.pId,
        refCodePid,
        id: values?.cliId,
        cantProducts: parseInt(
          product?.ProQuantity ? product?.ProQuantity : 0
        ),
        comments: product?.comment ?? '',
        dataOptional: dataOptional ?? [],
        dataExtra: filteredDataExtra || [],
        ProPrice: product.ProPrice
      }
    })
    : []
  const finalArrayProduct = arrayProduct.map((item) => {
    const totalExtra = item.dataExtra.reduce(
      (accumulator, extra) => accumulator + extra.newExtraPrice,
      0
    )
    return { ...item, totalExtra }
  })

  let totalSale = 0
  function sumProPriceAndTotalExtra (data) {
    return data.map((item) => {
      const totalExtra = item.dataExtra.reduce((acc, curr) => {
        const newExtraPrice = parseFloat(curr.newExtraPrice)
        if (isNaN(newExtraPrice)) {
          return acc
        }
        return acc + newExtraPrice
      }, 0)
      const total = item.ProPrice + totalExtra
      return { ...item, totalExtra, total }
    })
  }
  useEffect(() => {
    const dataCountTotal = sumProPriceAndTotalExtra(finalArrayProduct)
    dataCountTotal.forEach((a) => {
      const { total } = a || {}
      totalSale += total
      setTotalProductPrice(Math.abs(totalSale))
    })
    if (data.PRODUCT.length === 0) {
      setTotalProductPrice(0)
    }
  }, [totalProductPrice, totalSale, data, finalArrayProduct])

  const [discount, setDiscount] = useState({
    price: totalProductPrice || 0,
    discount: 0
  })

  function applyDiscount (percentage) {
    const validateCondition =
      isNaN(percentage) || percentage < 0 || percentage > 100

    if (validateCondition) {
      return sendNotification({
        title: 'Error',
        backgroundColor: 'error',
        description: 'el descuento debe ser un número entre 0 y 100%'
      })
    }
    const decimal = parseFloat(percentage) / 100
    // @ts-ignore
    const result = decimal * parseFloat(totalProductPrice)
    setDiscount({ price: result, discount: percentage })

    return { price: result, discount: percentage }
  }
  const totalProductsPrice = totalProductPrice
  const client = useApolloClient()
  const { getOnePedidoStore } = useGetSale()

  const handleSubmit = () => {
    // @ts-ignore
    if (errors?.change || errors?.valueDelivery) {
      return sendNotification({
        title: 'error',
        backgroundColor: 'warning',
        description: 'Completa los campos requeridos'
      })
    }
    setLoadingSale(true)
    const code = RandomCode(10)
    // @ts-ignore
    setCode(code)
    function convertInteger (cadena) {
      if (typeof cadena === 'string') {
        const numeroEntero = parseInt(cadena?.replace('.', ''))
        return numeroEntero
      }
      return cadena || 0
    }
    const {
      change,
      valueDelivery,
      tableId
    } = values || {
      change: 0,
      valueDelivery: 0,
      tableId: null,
      cliId: null
    }
    return registerSalesStore({
      variables: {
        input: finalArrayProduct || [],
        id: values?.cliId,
        pCodeRef: code,
        tableId,
        change: convertInteger(change),
        valueDelivery: convertInteger(valueDelivery),
        payMethodPState: data.payMethodPState,
        pickUp: 1,
        discount: discount.discount || 0,
        totalProductsPrice: convertInteger(totalProductsPrice) || 0
      }
    })
      .then((responseRegisterR) => {
        if (responseRegisterR) {
          const { data } = responseRegisterR || {}
          const { registerSalesStore } = data || {}
          const { Response } = registerSalesStore || {}
          if (Response && Response.success === true) {
            setPrint(false)
            client.query({
              query: GET_ALL_COUNT_SALES,
              fetchPolicy: 'network-only',
              // @ts-ignore
              onCompleted: (data) => {
                client.writeQuery({ query: GET_ALL_COUNT_SALES, data: { getTodaySales: data.countSales.todaySales } })
              }
            })
            setValues({})
            handleChange({ target: { name: 'tableId', value: '' } })
            getOnePedidoStore({
              variables: {
                pCodeRef: code || ''
              }
            }).then((responseSale) => {
              if (responseSale?.data?.getOnePedidoStore) {
                const currentSale = responseSale?.data?.getOnePedidoStore || {}
                const inComingCodeRef = currentSale?.pCodeRef || null
                if (!inComingCodeRef) return
                client.cache.modify({
                  fields: {
                    getAllOrdersFromStore (existingOrders = []) {
                      try {
                        const newGetAllOrdersFromStore = updateExistingOrders(existingOrders, inComingCodeRef, 4, currentSale)
                        return newGetAllOrdersFromStore
                      } catch (e) {
                        return existingOrders
                      }
                    }
                  }
                })
              }
            })
            router.push(
              {
                query: {
                  ...router.query,
                  saleId: code
                }
              },
              undefined,
              { shallow: true }
            )
          }
        }
        setLoadingSale(false)
      })
      .catch(() => {
        setLoadingSale(false)
        setErrorSale(true)
        setPrint(false)
        sendNotification({
          title: 'error',
          backgroundColor: 'error',
          description: 'Lo sentimos, ocurrió un error'
        })
      })
      .finally(() => {
        setPrint(false)
        setLoadingSale(false)
      })
  }

  const handleProduct = async (PRODUCT) => {
    setLoadingExtraProduct(true)
    const { pId } = PRODUCT || {}
    try {
      const originalArray = data.PRODUCT.find((item) => {
        return item.pId === pId
      })
      // OPTIONAL
      productFoodsOne({ variables: { pId } })
      const optionalAll = await ExtProductFoodsSubOptionalAll({
        variables: { pId }
      })
      const optionalFetch = optionalAll.data.ExtProductFoodsOptionalAll
      setDataOptional(optionalFetch || [])
      const existOptionalCookies = originalArray?.dataOptional
      const filteredDataOptional = existOptionalCookies?.length
        ? existOptionalCookies
          ?.map((obj) => {
            const filteredSubOptions =
              obj.ExtProductFoodsSubOptionalAll.filter(
                (subObj) => subObj.check === true
              )
            // Excluya todo el objeto padre si filteredSubOptions está vacío
            if (filteredSubOptions.length === 0) {
              return null
            }
            return {
              ...obj,
              ExtProductFoodsSubOptionalAll: filteredSubOptions
            }
          })
          .filter((obj) => obj !== null)
        : []

      // Actualizar optionalAll.data.ExtProductFoodsSubOptionalAll con los valores actualizados de originalArray2.ExtProductFoodsSubOptionalAll
      if (optionalFetch && filteredDataOptional) {
        const updateOption = optionalFetch
          .map((obj) => {
            const matchingArray = filteredDataOptional.find(
              (o) => o && o.opExPid === obj.opExPid
            )
            if (!matchingArray) {
              return obj
            }
            const extProductFoodsSubOptionalAll =
              obj.ExtProductFoodsSubOptionalAll || []
            const updateExtProductFoodsSubOptionalAll =
              extProductFoodsSubOptionalAll.map((subObj) => {
                const newItem =
                  matchingArray.ExtProductFoodsSubOptionalAll.find(
                    (newItem) =>
                      newItem && newItem.opSubExPid === subObj.opSubExPid
                  )
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
              ExtProductFoodsSubOptionalAll:
                updateExtProductFoodsSubOptionalAll
            }
          })
          .filter((obj) => obj)
        if (existOptionalCookies) {
          setDataOptional(updateOption || [])
        } else {
          setDataOptional(optionalAll.data.ExtProductFoodsOptionalAll || [])
        }
      }
      // NO OPTIONAL
      const extProduct = await ExtProductFoodsAll({ variables: { pId } })
      let finalData
      if (!originalArray?.dataExtra) {
        finalData = extProduct?.data?.ExtProductFoodsAll
      } else {
        const filteredData = originalArray.dataExtra.filter((item) =>
          extProduct?.data?.ExtProductFoodsAll.some(
            (newItem) => newItem.exPid === item.exPid
          )
        )
        finalData = originalArray?.dataExtra?.concat(
          extProduct?.data?.ExtProductFoodsAll?.filter(
            (item) =>
              !filteredData?.some(
                (filteredItem) => filteredItem.exPid === item.exPid
              )
          )
        )
      }
      setDataExtra(finalData)
      setProduct(() => {
        return {
          PRODUCT
        }
      })
      setLoadingExtraProduct(false)
    } catch (error) {
      setLoadingExtraProduct(false)
      sendNotification({
        title: 'error',
        backgroundColor: 'error',
        description: error || 'Lo sentimos, ocurrió un error'
      })
    }
  }
  const handleCleanFilter = () => {
    // @ts-ignore
    setValues({})
    setValuesDates({ fromDate: yearMonthDay, toDate: '' })
  }

  const disabledModalItems = (dataOptional?.length > 0 || dataExtra?.length > 0) && !loadingExtProductFoodsSubOptionalAll

  /**
* Filter objects with checked property equal to true.
* @param {Array} products - Array of objects.
* @returns {Array} - Array of objects with checked property equal to true.
*/
  function filterChecked (products) {
    if (!Array.isArray(products)) {
      return []
    }

    return products.filter(product => product?.checked === true).map(product => product.carProId)
  }

  // Obtener los carProIds de productos con checked en true
  const carProIds = filterChecked(categories)

  // Filtrar los productos de productsFood por los carProIds obtenidos
  const filteredProducts = filterProductsByCarProId(productsFood, carProIds)

  return {
    loading: loading || loadingSale,
    loadingExtraProduct,
    disabledModalItems: !disabledModalItems,
    loadingRegisterSale,
    errorSale,
    openCurrentSale,
    code,
    totalProductPrice,
    saveDataState,
    product,
    data,
    openCommentModal,
    inputValue,
    arrayProduct,
    delivery,
    valuesDates,
    print,
    finalFilter,
    showMore,
    max,
    search,
    values,
    initialStateSales,
    productsFood: filteredProducts,
    modalItem,
    sumExtraProducts,
    oneProductToComment: oneProductToComment ?? null,
    dataProduct: dataProduct?.productFoodsOne || {},
    dataOptional: dataOptional || [],
    dataExtra: dataExtra || [],
    fetchMore,
    discount,
    datCat: categories,
    loadingProduct: loading,
    handleChangeCheck,
    errors,
    handleUpdateAllExtra,
    dispatch,
    handleComment,
    setModalItem,
    handleChangeFilter,
    handleProduct,
    handleChange,
    setOpenCurrentSale,
    setErrors,
    onChangeInput,
    handleRemoveValue,
    applyDiscount,
    setDelivery,
    setValues,
    setShowMore,
    PriceRangeFunc,
    handleCleanFilter,
    handleSubmit,
    handleChangeFilterProduct,
    handleDecrementExtra,
    setTotalProductPrice,
    setInputValue,
    getSortedProduct,
    handleAddOptional,
    handleIncrementExtra,
    setProduct,
    setPrint: handlePrint,
    PRODUCT
  }
}
