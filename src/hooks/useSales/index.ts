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
import type { Product, ExtProductFoodOptional, ExtProductFoodsAll, AlertBoxType } from 'typesdefs'

import { Cookies } from '../../cookies'
import { RandomCode, getCurrentDomain } from '../../utils'
import { generateTicket } from '../../utils/generateCode'
import { useCatWithProduct } from '../useCatWithProduct'
import { CatProductWithProduct, GetCatProductsWithProductResponse } from '../useCatWithProduct/types'
import { useFormatDate } from '../useFormatDate'
import { useLogout } from '../useLogout'
import { useGetOneProductsFood, useProductsFood } from '../useProductsFood'
import {
  GET_ALL_EXTRA_PRODUCT,
  GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
  GET_ONE_PRODUCTS_FOOD
} from '../useProductsFood/queriesStore'
import { useStore } from '../useStore'

// import { updateExistingOrders } from '../useUpdateExistingOrders'

import { addToCartFunc } from './helpers/add-product.utils'
import { applyDiscountToCart } from './helpers/apply-discount-to-cart.utils'
import { initialStateSales, SalesActionTypes } from './helpers/constants'
import { decrementExtra } from './helpers/extras.utils'
import { filterChecked } from './helpers/filterChecked'
import { filterProductsByCarProId } from './helpers/filterProductsByCarProId.utils'
import { handleAddProduct } from './helpers/handleAddProduct.utils'
import { handleChangeNumber } from './helpers/handleChangeNumber.utils'
import { handleCommentProduct } from './helpers/handleCommentProduct'
import { handleRemoveComment } from './helpers/handleRemoveComment.utils'
import { handleToggleEditingStatus } from './helpers/handleToggleEditingStatus.utils'
import { handleUpdateAllExtraAndOptional } from './helpers/handleUpdateAllExtraAndOptional.utils'
import { incrementProductQuantity } from './helpers/increment-product-quantity.utils'
import { initializer } from './helpers/initializer.utils'
import { paymentMethod } from './helpers/paymentMethod.utils'
import { handleRemoveProduct } from './helpers/remove-product.utils'
import { searchedInput } from './helpers/searchedInput'
import { sendAlertStock } from './helpers/sendAlertStock.utils'
import { toggleFreeProducts } from './helpers/toggleFreeProducts'
import {
  CREATE_SHOPPING_CARD_TO_USER_STORE,
  GET_ALL_COUNT_SALES
} from './queries'
import { SalesReducerAction, SalesState, ValuesState } from './types'
import { UseSalesProps } from './types/use-sales.types'
import { useGetSale } from './useGetSale'

// eslint-disable-next-line
export const useSales = ({
  disabled = false,
  router,
  sendNotification = (args) => { return args },
  setAlertBox = (args) => { return args }
}: UseSalesProps) => {
  const keyToSaveData = String(process.env.NEXT_LOCAL_SALES_STORE)
  const saveDataState = JSON.parse(Cookies.get(keyToSaveData) ?? '[]')
  const domain = getCurrentDomain()
  const [loadingSale, setLoadingSale] = useState(false)
  const [delivery, setDelivery] = useState<boolean>(false)
  const [errorSale, setErrorSale] = useState(false)
  const { onClickLogout } = useLogout({
    setAlertBox
  })
  const [modalItem, setModalItem] = useState(false)
  const [openCommentModal, setOpenCommentModal] = useState(false)
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<CatProductWithProduct[]>([])

  useCatWithProduct({
    max: Infinity,
    callback: (data: GetCatProductsWithProductResponse) => {
      if (!data?.getCatProductsWithProduct?.catProductsWithProduct) {
        return setCategories(data.getCatProductsWithProduct?.catProductsWithProduct || [])
      }
      return setCategories([])
    }
  })

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalProductPrice, setTotalProductPrice] = useState<number>(0)
  const [showMore, setShowMore] = useState<number>(100)
  const [inputValue, setInputValue] = useState<string>('')

  const [print, setPrint] = useState<boolean>(false)
  const [errors, setErrors] = useState<Record<string, unknown>>({})

  const initialValuesState: ValuesState = {
    change: '',
    cliId: '',
    comment: '',
    tableId: '',
    valueDelivery: ''
  }
  const [values, setValues] = useState<ValuesState>(initialValuesState)

  const [dataStore] = useStore()
  const { createdAt, idStore } = dataStore ?? {
    createdAt: null,
    idStore: null
  }
  const [code, setCode] = useState<(null | string)>(null)
  const [openCurrentSale, setOpenCurrentSale] = useState(null)
  const [oneProductToComment, setOneProductToComment] = useState({})
  const { yearMonthDay } = useFormatDate({ date: createdAt })
  const [handleGetOneProduct] = useGetOneProductsFood()
  const [valuesDates, setValuesDates] = useState(() => {
    return { fromDate: yearMonthDay, toDate: '' }
  })

  const [product, setProduct] = useState<{ PRODUCT: { pId: string | null } }>({
    PRODUCT: {
      pId: null
    }
  })

  const [loadingExtraProduct, setLoadingExtraProduct] = useState(false)
  const [dataOptional, setDataOptional] = useState<ExtProductFoodOptional[]>([])
  const [dataExtra, setDataExtra] = useState<ExtProductFoodsAll[]>([])
  const [registerSalesStore, { loading: loadingRegisterSale }] = useMutation(
    CREATE_SHOPPING_CARD_TO_USER_STORE,
    {
      onCompleted: (data) => {
        const message = `${data?.registerSalesStore?.message}`
        const error = data?.registerSalesStore?.success
          ? 'Éxito'
          : 'Error'
        sendNotification({
          backgroundColor: error ? AlertBoxType.SUCCESS : AlertBoxType.ERROR,
          title: error,
          description: message
        })
        setAlertBox({ message, type: AlertBoxType.SUCCESS })
        if (message === 'Token expired') {
          onClickLogout({
            refresh: true,
          })
        }
        setOpenCurrentSale(data?.registerSalesStore.success)
      },
      onError: (error) => {
        sendNotification({
          backgroundColor: 'error',
          title: typeof error === 'string' ? error : 'Lo sentimos',
          description: 'ha ocurrido un error'
        })
      }
    }
  )

  const [productFoodsOne, { data: dataProduct }] = useLazyQuery(GET_ONE_PRODUCTS_FOOD)

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

  const [productsFood, {
    loading,
    fetchMore,
    pagination,
    refetch
  }] = useProductsFood({
    search: search?.length >= 4 ? search : '',
    gender: [],
    desc: [],
    categories: [],
    toDate: valuesDates?.toDate,
    fromDate: valuesDates?.fromDate,
    max: showMore,
    min: 0,
    isShopppingCard: true,
    idStore: idStore ?? '',
    dataSale: (Array.isArray(saveDataState?.PRODUCT) && saveDataState?.PRODUCT) ?? [],
    callback: () => { return }
  })

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    refetch({ page: pageNumber })
  }

  /**
   * Toggles the `checked` field of a category with maximum performance.
   * @param {string} caId - Category ID to toggle.
   */
  const handleChangeCheck = (caId: string) => {
    setCategories((prev) => {
      if (!prev || prev.length === 0) return prev

      const index = prev.findIndex((item) => { return item.carProId === caId })
      if (index === -1) return prev // nothing to update → no rerender

      const target = prev[index]

      const updatedItem = {
        ...target,
        checked: !target.checked
      }

      const newList = [...prev] // clone array ONCE
      newList[index] = updatedItem

      return newList
    })
  }


  const handlePrint = (): void => {
    if (disabled) {
      return sendNotification({
        title: 'Error',
        description: 'Esta es la descripción',
        backgroundColor: 'error'
      })
    }
    setPrint(!print)
    return undefined
  }

  const handleChangeFilter = (value: string): void => {
    return setSearch(value)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } },
    error: boolean
  ) => {
    const target = (e as React.ChangeEvent<HTMLInputElement>).target as { name: string; value: string }
    const { name, value } = target
    setErrors({ ...errors, [name]: error })
    setValues((prevValues) => {
      return {
        ...prevValues,
        [name]: value
      }
    })
  }

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    return setValuesDates({ ...valuesDates, [e.target.name]: e.target.value })
  }

  const handleChangeFilterProduct = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = searchedInput(e.target.value, setInputValue)
    if (text === undefined || text === '') {
      return
    }
    // const filteredData = handleList(text)
    // setFilteredList(filteredData)
  }

  const handleComment = (product: Product) => {
    if (product) {
      setOneProductToComment(product)
      setValues({
        ...values,
        comment: product?.comment ?? ''
      })
    }
    setOpenCommentModal(!openCommentModal)
  }

  const handleSuccessUpdateQuantity = (state: SalesState, payload: { payload: { pId: string } }) => {
    const pId = payload?.payload?.pId
    if (!pId) return state

    const list = state.PRODUCT
    const index = list.findIndex((item: Product) => { return item.pId === pId })

    // If no match → no state changes → no rerender
    if (index === -1) return state

    const target = list[index]
    const updatedItem = {
      ...target,
      editing: false,
      oldQuantity: target.ProQuantity ?? 0
    }

    // Clone array ONCE
    const newList = [...list]
    newList[index] = updatedItem
    sendNotification({
      title: 'Cantidad actualizada',
      backgroundColor: 'success',
      description: `La cantidad de ${target.pName} ha sido actualizada a ${updatedItem.ProQuantity}.`
    })
    return {
      ...state,
      PRODUCT: newList
    }
  }


  /**
   * Cancels the update of a product's quantity, resetting it to the previous value.
   * @param {Object} state - The current state.
   * @param {Object} payload - The payload containing the product ID.
   * @param payload.payload
   * @param payload.payload.pId
   * @returns {Object} - The new state with the updated product quantity and editing status.
   */
  const handleCancelUpdateQuantity = (state: SalesState, payload: { payload: { pId: string } }) => {
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
      return state
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
      PRODUCT: state.PRODUCT.map((item: Product) => {
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

  const PRODUCT = (state: SalesState, action: SalesReducerAction) => {
    switch (action.type) {
      case SalesActionTypes.ADD_TO_CART:
        return addToCartFunc({
          state,
          action,
          product: action.payload,
          sendAlertStock: stock => {
            return sendAlertStock(stock, sendNotification)
          },
          sendNotification
        })
      case SalesActionTypes.ADD_PRODUCT:
        return {
          ...state,
          // eslint-disable-next-line
          PRODUCT: [...state?.PRODUCT, action?.payload],
        }
      case SalesActionTypes.REMOVE_PRODUCT:
        return handleRemoveProduct(state, action, productsFood)
      case SalesActionTypes.REMOVE_PRODUCT_TO_CART:
        return {
          ...state,
          PRODUCT: state?.PRODUCT?.filter((t: Product) => {
            return t.pId !== action?.payload.pId
          }),
          counter: state.counter - action.payload.ProQuantity
        }
      case SalesActionTypes.ON_CHANGE: {
        return handleChangeNumber(
          state,
          action,
          productsFood,
          sendNotification
        )
      }
      case SalesActionTypes.UPDATE_SUCCESS_QUANTITY_EDITING_PRODUCT: {
        return handleSuccessUpdateQuantity(state, action.payload)
      }
      case SalesActionTypes.CANCEL_UPDATE_QUANTITY_EDITING_PRODUCT: {
        return handleCancelUpdateQuantity(state, action.payload)
      }
      case SalesActionTypes.REMOVE_ALL_PRODUCTS:
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

      case SalesActionTypes.TOGGLE_FREE_PRODUCT:
        return toggleFreeProducts(state, action.payload, productsFood)
      case SalesActionTypes.TOGGLE_EDITING_PRODUCT: {
        return handleToggleEditingStatus(state, action.payload)
      }
      case SalesActionTypes.INCREMENT: {
        return incrementProductQuantity({
          state,
          productId: action.id,
          productsFood,
          sendNotification
        })
      }

      case SalesActionTypes.PUT_COMMENT:
        return handleCommentProduct({
          state,
          action: action.payload as unknown as { payload: string | number },
          deleteValue: false,
          value: values.comment
        })
      case SalesActionTypes.PUT_EXTRA_PRODUCTS_AND_OPTIONAL_PRODUCT:
        return handleUpdateAllExtraAndOptional(state, {
          payload: action.payload,
          dataOptional,
          dataExtra
        })
      case SalesActionTypes.PRICE_RANGE:
        return {
          ...state,
          priceRange: action.payload
        }
      case SalesActionTypes.SORT:
        return { ...state, sortBy: action.payload }
      case SalesActionTypes.DECREMENT:
        return {
          ...state
        }
      case SalesActionTypes.PAYMENT_METHOD: return paymentMethod(state, action)
      case SalesActionTypes.APPLY_DISCOUNT: {
        return applyDiscountToCart(
          state,
          action.payload,
          sendNotification
        )
      }
      default:
        return state
    }
  }

  const [data, dispatch] = useReducer<React.Reducer<SalesState, SalesReducerAction>, SalesState>(PRODUCT, initialStateSales, initializer)

  const handleAddOptional = ({ exOptional = null, codeCategory = null }) => {
    if (!exOptional || !codeCategory) return
    const item = dataOptional.find((item) => { return item.code === codeCategory })
    if (!item) return
    const idx = item.ExtProductFoodsSubOptionalAll.findIndex(
      (el) => { return el.opSubExPid === exOptional }
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
      const newData = dataOptional.map((el) => { return el.code === codeCategory ? updatedItem : el }
      )

      setDataOptional(() => { return [...newData] })
    }
  }

  /**
   * @returns {void}
   */
  function handleUpdateAllExtra() {
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

          const filteredSubOptions = obj?.ExtProductFoodsSubOptionalAll?.filter(
            (subObj) => { return subObj?.check === true }
          )
          // Excluya todo el objeto padre si filteredSubOptions está vacío
          if (filteredSubOptions?.length === 0) {
            return null
          }

          return { ...obj, ExtProductFoodsSubOptionalAll: filteredSubOptions }
        })
        .filter((obj) => { return obj !== null }) // Elimine todos los objetos nulos del arreglo

      const filteredDataExtra = dataExtra?.filter((p) => { return p?.quantity !== undefined && p?.quantity !== 0 })
      if (product?.PRODUCT?.pId) {

        dispatch({
          type: SalesActionTypes.PUT_EXTRA_PRODUCTS_AND_OPTIONAL_PRODUCT,
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

  /**
   *
   * @param root0
   * @param root0.Adicionales
   * @param root0.index
   */
  function handleIncrementExtra({ Adicionales, index }: { Adicionales: any; index: number }) {
    const { pId } = product?.PRODUCT || {}
    const exPid = Adicionales?.exPid || null

    if (exPid && pId) {
      const newExtra = dataExtra.map((producto) => {

        if (exPid === producto.exPid) {

          const initialQuantity = producto?.quantity ? producto?.quantity : 0
          const newQuantity = initialQuantity + 1

          const newExtraPrice = producto.extraPrice * newQuantity

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
  const handleDecrementExtra = ({ Adicionales }: { Adicionales: any }) => {
    const exPid = Adicionales?.exPid
    if (!exPid) return
    setDataExtra((prev) => { return decrementExtra(prev as any, exPid) })
  }




  const getSortedProduct = useCallback((data: any[], sort: string | null) => {
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

  const PriceRangeFunc = (products: any[], price: number) => {
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

  const handleList = (text: string) => {
    const inputText = text.toLowerCase()
    let dataList = []
    dataList = (finalFilter || []).filter((item: { pName: string }) => {
      return item.pName.toLowerCase().includes(inputText)
    })
    return dataList
  }



  const arrayProduct = useMemo(() => {
    if (!Array.isArray(data.PRODUCT) || data.PRODUCT.length === 0) return []
    return data.PRODUCT.map((product: any) => {
      const filteredDataExtra = (product?.dataExtra ?? []).map(({ ...rest }) => { return rest })
      const dataOptional = (product?.dataOptional ?? []).map(({ ...rest }) => {
        const { ExtProductFoodsSubOptionalAll, ...r } = rest
        const adjusted = (ExtProductFoodsSubOptionalAll ?? []).map(({ ...s }) => { return s })
        return { ...r, ExtProductFoodsSubOptionalAll: adjusted }
      })
      return {
        pId: product.pId,
        refCodePid: RandomCode(20),
        id: values?.cliId,
        cantProducts: parseInt(String(product?.ProQuantity ?? 0)),
        comments: product?.comment ?? '',
        dataOptional: dataOptional ?? [],
        dataExtra: filteredDataExtra,
        ProPrice: product.ProPrice
      }
    })
  }, [data.PRODUCT, values?.cliId])

  const finalArrayProduct = useMemo(() => {
    return arrayProduct.map((item: any) => {
      const totalExtra = (item.dataExtra ?? []).reduce((acc: number, ex: any) => { return acc + (Number(ex.newExtraPrice) || 0) }, 0)
      return { ...item, totalExtra }
    })
  }, [arrayProduct])

  let totalSale = 0
  /**
   *
   * @param data
   */
  function sumProPriceAndTotalExtra(data: { dataExtra: { newExtraPrice: string }[]; ProPrice: number }[]) {
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
    dataCountTotal.forEach((a: { total: number }) => {
      const { total } = a || {}
      totalSale += total
      setTotalProductPrice(Math.abs(totalSale))
    })
    if (data.PRODUCT.length === 0) {
      setTotalProductPrice(0)
    }
  }, [totalProductPrice, totalSale, data, finalArrayProduct])

  const client = useApolloClient()
  const { getOneSalesStore } = useGetSale()
  console.log(data)
  const handleSubmit = () => {

    if (errors?.change || errors?.valueDelivery) {
      return sendNotification({
        title: 'error',
        backgroundColor: 'warning',
        description: 'Completa los campos requeridos'
      })
    }
    setLoadingSale(true)
    const {
      code,
      success,
      error
    } = generateTicket({
      length: 8,
      strategy: 'numeric',
      prefix: 'T-',
      timestamp: true
    })
    if (error) {
      setLoadingSale(false)
      return sendNotification({
        title: 'error',
        backgroundColor: 'error',
        description: 'Lo sentimos, ocurrió un error'
      })
    }
    if (!success) {
      setLoadingSale(false)
      return sendNotification({
        title: 'error',
        backgroundColor: 'error',
        description: 'Lo sentimos, ocurrió un error'
      })
    }

    setCode(code as string)
    /**
     *
     * @param cadena
     */
    function convertInteger(cadena: string | number) {
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

    const shoppingCartRefCode = `REF-${RandomCode(36)}`

    const input = finalArrayProduct.map((item: any) => {
      return {
        ...item,
        shoppingCartRefCode
      }
    })
    return registerSalesStore({
      variables: {
        input,
        id: values?.cliId,
        pCodeRef: code,
        tableId,
        change: convertInteger(change),
        valueDelivery: convertInteger(valueDelivery),
        payId: data.payId,
        pickUp: 1,
        shoppingCartRefCode,
        discount: {
          type: String(data.discountType),
          value: 2
        },
        totalProductsPrice: convertInteger(totalProductsPrice) || 0
      },
      update(cache) {
        cache.modify({
          fields: {
            productFoodsAll(existingProductFoodsAll = []) {
              return existingProductFoodsAll
            }
          }
        })
      }
    })
      .then((response) => {
        if (response) {
          const { data } = response
          const { registerSalesStore } = data ?? {}
          const { success } = registerSalesStore ?? {}
          if (success) {
            setPrint(false)
            client.query({
              query: GET_ALL_COUNT_SALES,
              fetchPolicy: 'network-only',
              // onCompleted: (data) => {
              //   client.writeQuery({ query: GET_ALL_COUNT_SALES, data: { getTodaySales: data.countSales.todaySales } })
              // }
            })
            setValues(initialValuesState)
            handleChange({ target: { name: 'tableId', value: '' } }, false)
            getOneSalesStore({
              variables: {
                pCodeRef: code || ''
              }
            }).then((responseSale: any) => {
              if (responseSale?.data?.getOneSalesStore) {
                const currentSale = responseSale?.data?.getOneSalesStore || {}
                const inComingCodeRef = currentSale?.pCodeRef || null
                if (!inComingCodeRef) return null
                // client.cache.modify({
                //   fields: {
                //     getAllOrdersFromStore (existingOrders = []) {
                //       try {
                //         const newGetAllOrdersFromStore = updateExistingOrders(existingOrders, inComingCodeRef, 4, currentSale)
                //         return newGetAllOrdersFromStore
                //       } catch (e) {
                //         return existingOrders
                //       }
                //     }
                //   }
                // })
              }
            })
            // router.push(
            //   {
            //     query: {
            //       ...router.query,
            //       saleId: code
            //     }
            //   },
            //   undefined,
            //   { shallow: true }
            // )
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

  const handleProduct = async (PRODUCT: Product) => {
    setLoadingExtraProduct(true)
    const { pId } = PRODUCT || {}
    try {
      const originalArray = data.PRODUCT.find((item: Product) => {
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
          ?.map((obj: any) => {
            const filteredSubOptions =
              obj.ExtProductFoodsSubOptionalAll.filter(
                (subObj: any) => { return subObj.check === true }
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
          .filter((obj: any) => { return obj !== null })
        : []

      // Actualizar optionalAll.data.ExtProductFoodsSubOptionalAll con los valores actualizados de originalArray2.ExtProductFoodsSubOptionalAll
      if (optionalFetch && filteredDataOptional) {
        const updateOption = optionalFetch
          .map((obj: any) => {
            const matchingArray = filteredDataOptional.find(
              (o: any) => { return o && o.opExPid === obj.opExPid }
            )
            if (!matchingArray) {
              return obj
            }
            const extProductFoodsSubOptionalAll =
              obj.ExtProductFoodsSubOptionalAll || []
            const updateExtProductSubOptionalAll =
              extProductFoodsSubOptionalAll.map((subObj: any) => {
                const newItem =
                  matchingArray.ExtProductFoodsSubOptionalAll.find(
                    (newItem: any) => { return newItem && newItem.opSubExPid === subObj.opSubExPid }
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
                updateExtProductSubOptionalAll
            }
          })
          .filter((obj: any) => { return obj })
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
        const filteredData = originalArray.dataExtra.filter((item: any) => {
          return extProduct?.data?.ExtProductFoodsAll.some(
            (newItem: any) => { return newItem.exPid === item.exPid }
          )
        }
        )
        finalData = originalArray?.dataExtra?.concat(
          extProduct?.data?.ExtProductFoodsAll?.filter(
            (item: any) => {
              return !filteredData?.some(
                (filteredItem: any) => { return filteredItem.exPid === item.exPid }
              )
            }
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
      if (error instanceof Error) {
        return sendNotification({
          title: 'error',
          backgroundColor: 'error',
          description: error.message ?? 'Lo sentimos, ocurrió un error'
        })
      }
    }
  }

  const handleCleanFilter = (): null => {
    setValues(initialValuesState)
    setValuesDates({ fromDate: yearMonthDay, toDate: '' })
    return null
  }

  const disabledModalItems = (dataOptional?.length > 0 || dataExtra?.length > 0) && !loadingExtProductFoodsSubOptionalAll

  // Obtener los carProIds de productos con checked en true
  const carProIds = filterChecked(categories)

  // Filtrar los productos de productsFood por los carProIds obtenidos
  const filteredProducts = filterProductsByCarProId(productsFood, carProIds)

  const allProducts = useMemo(() => {
    const productMap = new Map(data?.PRODUCT?.map((item: any) => { return [String(item.pId), item.ProQuantity || 0] }))

    return filteredProducts.map(product => {
      return {
        ...product,
        existsInSale: productMap.has(String(product.pId)),
        ProQuantity: productMap.get(String(product.pId)) || 0
      }
    })
  }, [data.PRODUCT, filteredProducts])

  const totalProductsPrice = useMemo(() => { return finalArrayProduct.reduce((acc: number, item: Product) => { return acc + (Number(item.ProPrice) || 0) + (Number(item.totalExtra) || 0) }, 0) }, [finalArrayProduct])

  const handleAddAllProductsToCart = () => {
    for (const product of allProducts) {
      const existsInCart = data.PRODUCT.some((item: any) => { return item.pId === product.pId })
      if (!existsInCart) {
        dispatch({ type: SalesActionTypes.ADD_TO_CART, payload: product })
      } else {
        dispatch({ type: SalesActionTypes.INCREMENT, id: product.pId })
      }
    }
  }

  useEffect(() => {
    Cookies.set(keyToSaveData, JSON.stringify(data), { domain: typeof domain === 'string' ? domain : undefined, path: '/' })
  }, [data, domain])

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
    search,
    values,
    initialStateSales,
    productsFood: allProducts,
    modalItem,
    sumExtraProducts: 19999999,
    oneProductToComment: oneProductToComment ?? null,
    dataProduct: dataProduct?.productFoodsOne || {},
    dataOptional: dataOptional || [],
    dataExtra: dataExtra || [],
    fetchMore,
    pagination,
    discount: 0,
    datCat: categories,
    currentPage,
    loadingProduct: loading,
    handleChangeCheck,
    errors,
    handleUpdateAllExtra,
    handleAddAllProductsToCart,
    dispatch,
    handlePageChange,
    handleComment,
    setModalItem,
    handleChangeFilter,
    handleProduct,
    handleChange,
    setOpenCurrentSale,
    setErrors,
    onChangeInput,
    handleAddProduct: (product: Product) => {
      handleAddProduct({
        product,
        dispatch,
        productsFood,
        sendNotification,
        handleGetOneProduct: async ({ pId }: { pId: string }) => {
          if (typeof handleGetOneProduct === 'function') {
            const result = await handleGetOneProduct({ variables: { pId } });
            // Ensure the return type matches the expected shape
            if (result && result.data && 'productFoodsOne' in result.data) {
              return { data: { productFoodsOne: result.data.productFoodsOne as Product | null } };
            }
            // If result is undefined or does not have the expected shape, return a default object
            return { data: { productFoodsOne: null } };
          }
          throw new Error('handleGetOneProduct is not a function');
        }
      })
    },
    handleRemoveValue: handleRemoveComment,
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
