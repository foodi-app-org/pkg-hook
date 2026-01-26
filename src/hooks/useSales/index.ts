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
  useState,
  ReducerStateWithoutAction,
} from 'react'
import { Cookies } from '../../cookies'
import { RandomCode, getCurrentDomain } from '../../utils'
import { useFormatDate } from '../useFormatDate'
import { useGetOneProductsFood, useProductsFood } from '../useProductsFood'
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
// import { updateExistingOrders } from '../useUpdateExistingOrders'
import { useGetSale } from './useGetSale'
import { useCatWithProduct } from '../useCatWithProduct'
import { useLogout } from '../useLogout'
import { generateTicket } from '../../utils/generateCode'
import { filterProductsByCarProId } from './helpers/filterProductsByCarProId.utils'
import { decrementExtra } from './helpers/extras.utils'
import { handleRemoveProduct } from './helpers/remove-product.utils'
import { addToCartFunc } from './helpers/add-product.utils'
import { incrementProductQuantity } from './helpers/increment-product-quantity.utils'
import { initialStateSales, SalesActionTypes } from './helpers/constants'
import { applyDiscountToCart, TypeDiscount } from './helpers/apply-discount-to-cart.utils'
import { SalesReducerAction, SalesState, ValuesState } from './types'
import { UseSalesProps } from './types/use-sales.types'
import { initializer } from './helpers/initializer.utils'

export const useSales = ({
  disabled = false,
  router,
  sendNotification = (args) => { return args },
  setAlertBox = (args) => { return args }
}: UseSalesProps) => {
  const domain = getCurrentDomain()
  const [loadingSale, setLoadingSale] = useState(false)
  const [errorSale, setErrorSale] = useState(false)
  const [onClickLogout] = useLogout({})

  const [modalItem, setModalItem] = useState(false)
  const [openCommentModal, setOpenCommentModal] = useState(false)
  const keyToSaveData = process.env.LOCAL_SALES_STORE
  const saveDataState = JSON.parse(Cookies.get(keyToSaveData) || '[]')
  const [search, setSearch] = useState('')
  const [datCat] = useCatWithProduct({})
  const [categories, setCategories] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState<number>(1)
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
  const [code, setCode] = useState(null)
  const [openCurrentSale, setOpenCurrentSale] = useState(null)
  const [oneProductToComment, setOneProductToComment] = useState({})
  const [sumExtraProducts, setSumExtraProducts] = useState(0)
  const { yearMonthDay } = useFormatDate({ date: createdAt })
  const [handleGetOneProduct] = useGetOneProductsFood()
  const [valuesDates, setValuesDates] = useState(() => {
    return { fromDate: yearMonthDay, toDate: '' }
  })

  interface ProductState {
    PRODUCT: {
      pId: string | null
    }
  }
  const [product, setProduct] = useState<ProductState>({
    PRODUCT: {
      pId: null
    }
  })
  const [loadingExtraProduct, setLoadingExtraProduct] = useState(false)
  const [dataOptional, setDataOptional] = useState<any[]>([])
  const [dataExtra, setDataExtra] = useState<any[]>([])
  const [registerSalesStore, { loading: loadingRegisterSale }] = useMutation(
    CREATE_SHOPPING_CARD_TO_USER_STORE,
    {
      onCompleted: (data) => {
        const message = `${data?.registerSalesStore?.message}`
        const error = data?.registerSalesStore?.success
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
        setOpenCurrentSale(data?.registerSalesStore.success)
      },
      onError: (error) => {
        sendNotification({
          backgroundColor: 'error',
          title: error ?? 'Lo sentimos',
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
    // @ts-ignore
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
    callback: () => { return null }
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
      if (!prev || prev.length === 0) return prev;

      const index = prev.findIndex((item) => item.carProId === caId);
      if (index === -1) return prev; // nothing to update → no rerender

      const target = prev[index];

      const updatedItem = {
        ...target,
        checked: !target.checked,
      };

      const newList = [...prev]; // clone array ONCE
      newList[index] = updatedItem;

      return newList;
    });
  };


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

  const handleChangeFilter = (value: string): void => {
    return setSearch(value)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } },
    error: boolean
  ) => {
    const target: any = (e as any).target
    const { name, value } = target
    setErrors({ ...errors, [name]: error })
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value
    }))
  }

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    return setValuesDates({ ...valuesDates, [e.target.name]: e.target.value })
  }

  /**
   * Toggles editing state of a product with maximum performance.
   * @param {any} state - Current reducer state.
   * @param {any} action - Payload with product ID.
   * @returns {any} New updated state.
   */
  const handleToggleEditingStatus = (state: any, action: any) => {
    const pId = action?.payload?.pId;
    if (!pId) return state;

    const list = state.PRODUCT;
    const index = list.findIndex((item: any) => item.pId === pId);

    // If no match, nothing changes → no re-render
    if (index === -1) return state;

    const target = list[index];

    const updatedItem = {
      ...target,
      editing: !target.editing,
      oldQuantity: target.ProQuantity ?? 0,
    };

    // Clone the array only once
    const newList = [...list];
    newList[index] = updatedItem;

    return {
      ...state,
      PRODUCT: newList,
    }
  }


  const handleChangeFilterProduct = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = searchedInput(e.target.value)
    if (text === undefined || text === '') {
      return
    }
    const filteredData = handleList(text)
    setFilteredList(filteredData)
  }

  const handleComment = (product: any) => {
    if (product) {
      setOneProductToComment(product)
      setValues({
        ...values,
        comment: product?.comment ?? ''
      })
    }
    setOpenCommentModal(!openCommentModal)
  }

  /**
   * Updates a single product inside the PRODUCT array with maximum performance.
   * @param {any} state - Current state.
   * @param {any} payload - Action payload.
   * @returns {any} New updated state.
   */
  const handleSuccessUpdateQuantity = (state: any, payload: any) => {
    const pId = payload?.payload?.pId
    if (!pId) return state;

    const list = state.PRODUCT
    const index = list.findIndex((item: any) => item.pId === pId)

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
      PRODUCT: newList,
    };
  };


  /**
 * Cancels the update of a product's quantity, resetting it to the previous value.
 * @param {Object} state - The current state.
 * @param {Object} payload - The payload containing the product ID.
 * @returns {Object} - The new state with the updated product quantity and editing status.
 */
  const handleCancelUpdateQuantity = (state: any, payload: any) => {
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
      PRODUCT: state.PRODUCT.map((item: any) => {
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

  const paymentMethod = (state: any, action: any) => {
    return {
      ...state,
      payId: action.payload
    }
  }


  const handleAddProduct = async (product: any) => {
    const pId = String(product?.pId)
    const memo = productsFood.find((item: any) => String(item.pId) === pId)
    if (!memo) {
      const response = await handleGetOneProduct({ pId })
      if (response.data?.productFoodsOne == null) return sendNotification({
        title: 'Error',
        backgroundColor: 'error',
        description: 'No se pudo obtener el producto'
      })
      const productData = response.data?.productFoodsOne ?? { pId: null }
      return dispatch({
        type: SalesActionTypes.ADD_TO_CART,
        payload: productData
      })
    }
    return dispatch({
      type: SalesActionTypes.ADD_TO_CART,
      payload: memo
    })
  }

  const PRODUCT = (state: any, action: any) => {
    switch (action.type) {
      case SalesActionTypes.ADD_TO_CART:
        return addToCartFunc({
          state,
          action,
          product: action.payload,
          sendAlertStock,
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
          PRODUCT: state?.PRODUCT?.filter((t: any) => {
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
        return handleSuccessUpdateQuantity(state, action)
      }
      case SalesActionTypes.CANCEL_UPDATE_QUANTITY_EDITING_PRODUCT: {
        return handleCancelUpdateQuantity(state, action)
      }
      case SalesActionTypes.REMOVE_ALL_PRODUCTS:
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

      case SalesActionTypes.TOGGLE_FREE_PRODUCT:
        return toggleFreeProducts(state, action)
      case SalesActionTypes.TOGGLE_EDITING_PRODUCT: {
        return handleToggleEditingStatus(state, action)
      }
      case SalesActionTypes.INCREMENT: {
        return incrementProductQuantity({
          state,
          productId: action.id,
          productsFood,
          sendNotification
        });
      }

      case SalesActionTypes.PUT_COMMENT:
        return commentProducts(state, action)
      case SalesActionTypes.PUT_EXTRA_PRODUCTS_AND_OPTIONAL_PRODUCT:
        return handleUpdateAllExtraAndOptional(state, action)
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

  const handleRemoveValue = useCallback(({ name, value, pId }: { name: string; value: any; pId: string }) => {
    setValues({
      ...values,
      [name]: value ?? ''
    })
    sendNotification({
      backgroundColor: 'success',
      title: 'Comentario eliminado',
      description: 'Has eliminado el comentario!'
    })
    // @ts-ignore
    return dispatch({
      type: SalesActionTypes.PUT_COMMENT,
      payload: pId,
      value: ''
    })
  }, [])

  useEffect(() => {
    Cookies.set(keyToSaveData, JSON.stringify(data), { domain, path: '/' })
  }, [data, domain])

  const handleAddOptional = ({ exOptional = null, codeCategory = null }) => {
    if (!exOptional || !codeCategory) return
    const item = dataOptional.find((item) => item.code === codeCategory)
    if (!item) return
    const idx = item.ExtProductFoodsSubOptionalAll.findIndex(
      (el: any) => el.opSubExPid === exOptional
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

  function handleUpdateAllExtraAndOptional(state: any, action: any) {
    return {
      ...state,
      PRODUCT: state?.PRODUCT?.map((items: any) => {
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
    const val = arr.findIndex((item: any) => item.quantity !== 0)
    if (val === -1) {
      setSumExtraProducts(0)
    }
    function sumNewExtraPrice() {
      let sum = 0
      arr.forEach((obj: any) => {
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
          // @ts-ignore
          const filteredSubOptions = obj?.ExtProductFoodsSubOptionalAll?.filter(
            (subObj: any) => subObj?.check === true
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

  // @ts-ignore
  function handleIncrementExtra({ Adicionales, index }) {
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
  const handleDecrementExtra = ({ Adicionales }: { Adicionales: any }) => {
    const exPid = Adicionales?.exPid
    if (!exPid) return
    setDataExtra((prev) => decrementExtra(prev as any, exPid))
  }


  function sendAlertStock(stock: number) {
    return sendNotification({
      title: 'Stock insuficiente',
      backgroundColor: 'warning',
      description: `Solo hay ${stock} unidades disponibles en el inventario`
    })
  }

  /**
   * Toggles free mode for a product and recalculates its price
   * with maximum performance.
   * @param {any} state - Current reducer state.
   * @param {any} action - Payload containing pId.
   * @returns {any} Updated state.
   */
  function toggleFreeProducts(state: any, action: any) {
    const pId = action?.payload?.pId;
    if (!pId) return state;

    // Find the reference product price only once
    const referenceProduct = productsFood.find((item: any) => item.pId === pId);
    if (!referenceProduct) return state;

    const list = state.PRODUCT;
    const index = list.findIndex((item: any) => item.pId === pId);

    // If no match, skip re-render
    if (index === -1) return state;

    const target = list[index];

    const newFreeState = !target.free;

    const updatedItem = {
      ...target,
      free: newFreeState,
      ProPrice: newFreeState
        ? 0
        : (target.ProQuantity ?? 1) * (referenceProduct.ProPrice ?? 0)
    };

    // Clone array ONCE
    const newList = [...list];
    newList[index] = updatedItem;

    return {
      ...state,
      PRODUCT: newList,
    };
  }


  // COMMENT_FREE_PRODUCT
  function commentProducts(state: any, action: any, deleteValue = false) {
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
      PRODUCT: state?.PRODUCT?.map((items: any) => {
        return items.pId === action.payload
          ? {
            ...items,
            comment: deleteValue ? '' : values.comment
          }
          : items
      })
    }
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
    dataList = finalFilter.filter((item) => {
      return item.pName.toLowerCase().includes(inputText)
    })
    return dataList
  }

  const searchedInput = (words: string) => {
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

  const arrayProduct = useMemo(() => {
    if (!Array.isArray(data.PRODUCT) || data.PRODUCT.length === 0) return [];
    return data.PRODUCT.map((product: any) => {
      const filteredDataExtra = (product?.dataExtra ?? []).map(({ __typename, ...rest }) => rest);
      const dataOptional = (product?.dataOptional ?? []).map(({ __typename, ...rest }) => {
        const { ExtProductFoodsSubOptionalAll, ...r } = rest;
        const adjusted = (ExtProductFoodsSubOptionalAll ?? []).map(({ __typename, ...s }) => s);
        return { ...r, ExtProductFoodsSubOptionalAll: adjusted };
      });
      return {
        pId: product.pId,
        refCodePid: RandomCode(20),
        id: values?.cliId,
        cantProducts: parseInt(String(product?.ProQuantity ?? 0)),
        comments: product?.comment ?? '',
        dataOptional: dataOptional ?? [],
        dataExtra: filteredDataExtra,
        ProPrice: product.ProPrice
      };
    })
  }, [data.PRODUCT, values?.cliId]);

  const finalArrayProduct = useMemo(() => {
    return arrayProduct.map((item: any) => {
      const totalExtra = (item.dataExtra ?? []).reduce((acc: number, ex: any) => acc + (Number(ex.newExtraPrice) || 0), 0);
      return { ...item, totalExtra }
    });
  }, [arrayProduct])

  let totalSale = 0
  function sumProPriceAndTotalExtra(data) {
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

  const client = useApolloClient()
  const { getOneSalesStore } = useGetSale()
  console.log(data)
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
    // @ts-ignore
    setCode(code)
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
              // @ts-ignore
              onCompleted: (data) => {
                client.writeQuery({ query: GET_ALL_COUNT_SALES, data: { getTodaySales: data.countSales.todaySales } })
              }
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

  const handleProduct = async (PRODUCT: any) => {
    setLoadingExtraProduct(true)
    const { pId } = PRODUCT || {}
    try {
      const originalArray = data.PRODUCT.find((item: any) => {
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
                (subObj: any) => subObj.check === true
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
          .filter((obj: any) => obj !== null)
        : []

      // Actualizar optionalAll.data.ExtProductFoodsSubOptionalAll con los valores actualizados de originalArray2.ExtProductFoodsSubOptionalAll
      if (optionalFetch && filteredDataOptional) {
        const updateOption = optionalFetch
          .map((obj: any) => {
            const matchingArray = filteredDataOptional.find(
              (o: any) => o && o.opExPid === obj.opExPid
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
                    (newItem: any) =>
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
                updateExtProductSubOptionalAll
            }
          })
          .filter((obj: any) => obj)
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
        const filteredData = originalArray.dataExtra.filter((item: any) =>
          extProduct?.data?.ExtProductFoodsAll.some(
            (newItem: any) => newItem.exPid === item.exPid
          )
        )
        finalData = originalArray?.dataExtra?.concat(
          extProduct?.data?.ExtProductFoodsAll?.filter(
            (item: any) =>
              !filteredData?.some(
                (filteredItem: any) => filteredItem.exPid === item.exPid
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

  /**
* Filter objects with checked property equal to true.
* @param {Array} products - Array of objects.
* @returns {Array} - Array of objects with checked property equal to true.
*/
  function filterChecked(products: any[]) {
    if (!Array.isArray(products)) {
      return []
    }

    return products.filter(product => product?.checked === true)?.map(product => product?.carProId)
  }

  // Obtener los carProIds de productos con checked en true
  const carProIds = filterChecked(categories)

  // Filtrar los productos de productsFood por los carProIds obtenidos
  const filteredProducts = filterProductsByCarProId(productsFood, carProIds)

  const allProducts = useMemo(() => {
    const productMap = new Map(data?.PRODUCT?.map((item: any) => [String(item.pId), item.ProQuantity || 0]))

    return filteredProducts.map(product => ({
      ...product,
      existsInSale: productMap.has(String(product.pId)),
      ProQuantity: productMap.get(String(product.pId)) || 0
    }))
  }, [data.PRODUCT, filteredProducts])

  const totalProductsPrice = useMemo(() => { return finalArrayProduct.reduce((acc: number, item: any) => acc + (Number(item.ProPrice) || 0) + (Number(item.totalExtra) || 0), 0) }, [finalArrayProduct])

  const handleAddAllProductsToCart = () => {
    for (const product of allProducts) {
      const existsInCart = data.PRODUCT.some((item: any) => item.pId === product.pId)
      if (!existsInCart) {
        dispatch({ type: SalesActionTypes.ADD_TO_CART, payload: product })
      } else {
        dispatch({ type: SalesActionTypes.INCREMENT, id: product.pId })
      }
    }
  }

  /**
 * handleChangeNumber
 * Updates product quantity from input change with full validations.
 * @param {any} state - Current reducer state
 * @param {any} action - Action with payload { value, index, id }
 * @param {any[]} productsFood - Products memory source
 * @param {(n:{title:string,backgroundColor:string,description?:string})=>void} sendNotification
 * @param {(a:any)=>void} dispatch
 * @returns {any} Updated state
 */
  function handleChangeNumber(
    state: any,
    action: any,
    productsFood: any[] = [],
    sendNotification: Function
  ) {
    const event = action?.payload ?? {}
    const { value, index, id } = event

    if (!id || index === undefined) return state

    const productExist = productsFood.find((item: any) => item.pId === id)
    const oneProduct = state?.PRODUCT?.find((item: any) => item.pId === id)

    // Product not found
    if (!productExist || !oneProduct) return state

    // No stock
    if (productExist.stock === 0) {
      sendNotification({
        title: 'Sin stock',
        backgroundColor: 'warning',
        description: 'Producto sin stock disponible'
      })
      return state
    }

    // Remove product if quantity <= 0
    if (value <= 0) {
      sendNotification({
        title: 'Producto eliminado',
        backgroundColor: 'info',
        description: `Has eliminado ${oneProduct.pName} del carrito.`
      })
      return {
        ...state,
        PRODUCT: state.PRODUCT.filter((t: any) => t.pId !== id),
        counter: (state.counter ?? 0) - (oneProduct.ProQuantity || 0)
      }
    }

    const safeValue = Number(value) || 0
    const maxStock = productExist.manageStock ? productExist.stock : safeValue
    const finalQuantity = Math.min(safeValue, maxStock)

    // Stock exceeded
    if (safeValue > productExist.stock && productExist.manageStock) {
      sendNotification({
        title: 'Stock insuficiente',
        backgroundColor: 'warning',
        description: `No puedes agregar más unidades de ${oneProduct.pName}. Stock disponible: ${productExist.stock}`
      })
    }

    const updatedProducts = state.PRODUCT.map((item: any, i: number) =>
      i === index
        ? {
          ...item,
          ProQuantity: finalQuantity,
          ProPrice: finalQuantity * (productExist.ProPrice ?? 0)
        }
        : item
    )

    return {
      ...state,
      PRODUCT: updatedProducts,
      counter: (state.counter ?? 0) + 1
    }
  }

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
    sumExtraProducts,
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
    handleAddProduct,
    handleRemoveValue,
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
