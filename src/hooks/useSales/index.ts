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
import { applyDiscountToCart, TypeDiscount } from './helpers/apply-discount-to-cart.utils'
import { initialStateSales, SalesActionTypes } from './helpers/constants'
import { decrementExtra, removeExtra } from './helpers/extras.utils'
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
import { recalculateCounter } from './helpers/recalculateCounter.utils'
import { handleRemoveProduct } from './helpers/remove-product.utils'
import { searchedInput } from './helpers/searchedInput'
import { sendAlertStock } from './helpers/sendAlertStock.utils'
import { toggleFreeProducts } from './helpers/toggleFreeProducts'
import { updateStockCacheAfterSale } from './helpers/update-stock-cache.utils'
import {
  CREATE_SHOPPING_CARD_TO_USER_STORE,
  GET_ALL_COUNT_SALES
} from './queries'
import { SalesReducerAction, SalesState, ValuesState } from './types'
import { UseSalesProps } from './types/use-sales.types'
import { useGetSale } from './useGetSale'
import { usePendingOrders } from './usePendingOrders'
import type { PendingOrder, PendingOrderCustomer } from './types/pending-orders.types'

import type { AlertBoxType, Product, ExtProductFoodOptional, ExtProductFoodsAll } from 'typesdefs'
import { useManageQueryParams } from '../useManageQueryParams'
import { stripTypename } from '@apollo/client/utilities'
export { SalesActionTypes } from './helpers/constants'

export const useSales = ({
  disabled = false,
  // router,
  sendNotification = (args) => { return args },
  setAlertBox = (args) => { return args },
  onSaleSuccess = (args) => { return args },
  pendingOrdersPersistence
}: UseSalesProps) => {
  const keyToSaveData = String(process.env.NEXT_LOCAL_SALES_STORE)
  const saveDataState = JSON.parse(Cookies.get(keyToSaveData) ?? '[]')
  const domain = getCurrentDomain()
  const { handleQuery } = useManageQueryParams()

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
        return setCategories([])
      }

      return setCategories(
        data.getCatProductsWithProduct.catProductsWithProduct || []
      )
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

  // Variables de filtro aplicadas desde el modal (categorías, orden, precio, estado).
  // Genéricas: provienen de buildFilterVariables(selection) en el front.
  const [appliedFilters, setAppliedFilters] = useState<{
    categories?: string[]
    orderBy?: string[]
    priceMin?: number | null
    priceMax?: number | null
    pState?: number
  }>({})

  const [loadingExtraProduct, setLoadingExtraProduct] = useState(false)
  const [dataOptional, setDataOptional] = useState<ExtProductFoodOptional[]>([])
  const [dataExtra, setDataExtra] = useState<ExtProductFoodsAll[]>([])
  /**
   * Renderiza el resultado de `registerSalesStore` (éxito o error de negocio).
   *
   * Se extrae a una función porque la misma respuesta puede llegar por dos vías:
   *  - `onCompleted`, cuando la mutación responde sin `graphQLErrors`.
   *  - `onError`, cuando GraphQL adjunta `graphQLErrors` (p. ej. un error de
   *    serialización del backend en `context.value`) pero igual trae el `data`
   *    parcial con el `errors[]` de negocio (stock insuficiente, etc.).
   *
   * Con esto el usuario siempre ve el detalle real ("Stock insuficiente para el
   * producto X. Solicitado: 4, disponible: 1.") en lugar del genérico
   * "ha ocurrido un error".
   *
   * @param response Objeto `registerSalesStore` de la respuesta.
   * @returns `true` si la venta fue exitosa.
   */
  const renderSaleResponse = (response: {
    success?: boolean | null
    message?: string | null
    errors?: Array<{ message?: string; type?: string }> | null
  } | null | undefined): boolean => {
    const isSuccess = Boolean(response?.success)
    const rawMessage = `${response?.message ?? ''}`

    // El backend devuelve un `errors[]` estructurado (por ejemplo, cuando un
    // producto manejado por stock se quedó sin inventario y la venta se
    // bloqueó). Construimos una descripción legible concatenando esos
    // mensajes; si no hay `errors`, caemos al `message` general.
    const backendErrors: Array<{ message?: string; type?: string }> =
      Array.isArray(response?.errors) ? response.errors : []
    const errorsDescription = backendErrors
      .map((err: { message?: string }) => err?.message)
      .filter((msg: unknown): msg is string => typeof msg === 'string' && msg.length > 0)
      .join('\n')
    const description = !isSuccess && errorsDescription
      ? errorsDescription
      : (rawMessage || 'Lo sentimos, ocurrió un error')

    // El estado de stock insuficiente es una regla de negocio (no un fallo
    // técnico), así que se notifica como 'warning'; cualquier otro fallo va
    // como 'error' y el éxito como 'success'.
    const hasStockError = backendErrors.some((err: { type?: string }) =>
      typeof err?.type === 'string' && err.type.startsWith('stock.')
    )
    const backgroundColor = isSuccess
      ? 'success'
      : hasStockError
        ? 'warning'
        : 'error'

    sendNotification({
      backgroundColor,
      title: isSuccess ? 'Éxito' : hasStockError ? 'Sin stock' : 'Error',
      description
    })
    setAlertBox({
      message: description,
      type: (isSuccess ? 'success' : 'error') as AlertBoxType
    })
    if (rawMessage === 'Token expired') {
      onClickLogout({
        refresh: true,
      })
    }
    // Solo cerramos/avanzamos la venta cuando realmente fue exitosa, para que
    // el usuario pueda corregir el carrito si el backend la rechazó.
    setOpenCurrentSale(response?.success as any)
    return isSuccess
  }

  const [registerSalesStore, { loading: loadingRegisterSale }] = useMutation(
    CREATE_SHOPPING_CARD_TO_USER_STORE,
    {
      // 'all' hace que Apollo entregue el `data` parcial a `onCompleted` aunque
      // la respuesta traiga `graphQLErrors`. Esto es clave: el backend puede
      // adjuntar un error de serialización (context.value tipado como Int) y,
      // aun así, el `data.registerSalesStore.errors[]` con el detalle de stock
      // sigue presente. Sin 'all', Apollo iría directo a `onError` y se perdería
      // el mensaje real.
      errorPolicy: 'all',
      onCompleted: (data) => {
        renderSaleResponse(data?.registerSalesStore)
      },
      onError: (error: any) => {
        // Si GraphQL reporta errores pero igual vino el `data` parcial con el
        // `errors[]` de negocio, lo renderizamos en lugar del mensaje genérico.
        // Apollo expone ese payload en `error.graphQLErrors[i].data` o en el
        // `networkError.result.data`, según el transporte.
        const partialResponse =
          error?.graphQLErrors?.find((gqlErr: any) => gqlErr?.data?.registerSalesStore)?.data
            ?.registerSalesStore ??
          error?.networkError?.result?.data?.registerSalesStore ??
          null

        if (partialResponse) {
          renderSaleResponse(partialResponse)
          return
        }

        sendNotification({
          backgroundColor: 'error',
          title: 'Lo sentimos',
          description:
            typeof error?.message === 'string' && error.message.length > 0
              ? error.message
              : 'ha ocurrido un error'
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
    categories: appliedFilters.categories ?? [],
    toDate: valuesDates?.toDate,
    fromDate: valuesDates?.fromDate,
    max: showMore,
    min: 0,
    priceMin: appliedFilters.priceMin ?? null,
    priceMax: appliedFilters.priceMax ?? null,
    orderBy: appliedFilters.orderBy ?? [],
    pState: appliedFilters.pState,
    isShoppingCard: true,
    idStore: idStore ?? '',
    dataSale: (Array.isArray(saveDataState?.PRODUCT) && saveDataState?.PRODUCT) ?? [],
    callback: () => { return }
  })

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    refetch({ page: pageNumber })
  }

  /**
   * Aplica las variables de filtro provenientes del modal y re-consulta
   * los productos. `variables` es genérico: lo produce buildFilterVariables()
   * del hook useFilterConfigs, por lo que cualquier filtro nuevo funciona sin
   * cambios aquí.
   *
   * @param variables - Variables de query (categories, orderBy, priceMin, priceMax, pState).
   */
  const handleApplyFilters = (variables: {
    categories?: string[]
    orderBy?: string[]
    priceMin?: number
    priceMax?: number
    pState?: number
  } = {}) => {
    const next = {
      categories: variables.categories ?? [],
      orderBy: variables.orderBy ?? [],
      priceMin: typeof variables.priceMin === 'number' ? variables.priceMin : null,
      priceMax: typeof variables.priceMax === 'number' ? variables.priceMax : null,
      pState: variables.pState
    }
    setAppliedFilters(next)
    setCurrentPage(1)
    refetch({
      page: 1,
      categories: next.categories,
      orderBy: next.orderBy,
      priceMin: next.priceMin,
      priceMax: next.priceMax,
      pState: next.pState
    })
  }

  /**
   * Limpia todos los filtros aplicados y recarga la lista completa.
   */
  const handleClearFilters = () => {
    setAppliedFilters({})
    setCurrentPage(1)
    refetch({
      page: 1,
      categories: [],
      orderBy: [],
      priceMin: null,
      priceMax: null,
      pState: undefined
    })
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
      setOpenCommentModal(true)
      return
    }
    setOpenCommentModal(false)
  }

  /**
   * Confirms the edited quantity of a product.
   *
   * Closes the editing mode and freezes the confirmed quantity as the new
   * `oldQuantity`, so a later cancel restores the right baseline. The counter
   * is recomputed from the real products (single source of truth) so it can
   * never drift — every ON_CHANGE keystroke that happened during editing is
   * reconciled here into a correct total.
   *
   * @param {SalesState} state - Current sales state.
   * @param {{ pId: string }} action - Product being confirmed.
   * @returns {SalesState} State with the product committed and counter in sync.
   */
  const handleSuccessUpdateQuantity = (
    state: SalesState,
    action: { pId: string }
  ): SalesState => {
    const pId = action?.pId

    if (!pId) {
      return state
    }

    const index = state.PRODUCT.findIndex(
      (item: Product) => item.pId === pId
    )

    if (index === -1) {
      return state
    }

    const target = state.PRODUCT[index]

    const rawQuantity = Number(target.ProQuantity)
    const confirmedQuantity =
      Number.isFinite(rawQuantity) && rawQuantity > 0
        ? rawQuantity
        : 0

    const updatedItem: Product = {
      ...target,
      editing: false,
      ProQuantity: confirmedQuantity,
      oldQuantity: confirmedQuantity
    }

    const PRODUCT = [...state.PRODUCT]
    PRODUCT[index] = updatedItem

    sendNotification({
      title: 'Cantidad actualizada',
      backgroundColor: 'success',
      description: `La cantidad de ${target.pName} ha sido actualizada a ${confirmedQuantity}.`
    })

    return {
      ...state,
      PRODUCT,
      counter: recalculateCounter(PRODUCT)
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
  const handleCancelUpdateQuantity = (
    state: SalesState,
    action: { pId: string }
  ): SalesState => {
    const pId = action?.pId

    if (!pId) {
      return state
    }

    const index = state.PRODUCT.findIndex(
      (item: Product) => item.pId === pId
    )

    if (index === -1) {
      return state
    }

    const target = state.PRODUCT[index]

    // Baseline to restore. If oldQuantity was never set (edge cases), fall back
    // to the current quantity so we never leave the product in a broken state.
    const restoredQuantity =
      Number.isFinite(Number(target.oldQuantity)) &&
      Number(target.oldQuantity) >= 0
        ? Number(target.oldQuantity)
        : Math.max(0, Number(target.ProQuantity) || 0)

    // Resolve a safe unit price. Prefer an explicit unitPrice; otherwise derive
    // it from the current line total / current quantity. This keeps ProPrice
    // consistent even when unitPrice is missing.
    const currentQuantity = Number(target.ProQuantity)
    const derivedUnitPrice =
      Number.isFinite(currentQuantity) && currentQuantity > 0
        ? (Number(target.ProPrice) || 0) / currentQuantity
        : 0
    const unitPrice =
      Number.isFinite(Number(target.unitPrice)) &&
      Number(target.unitPrice) >= 0
        ? Number(target.unitPrice)
        : derivedUnitPrice

    const isFree = Boolean(target.free)

    const updatedItem: Product = {
      ...target,
      editing: false,
      ProQuantity: restoredQuantity,
      ProPrice: isFree ? 0 : restoredQuantity * unitPrice
    }

    const PRODUCT = [...state.PRODUCT]
    PRODUCT[index] = updatedItem

    // Recompute the counter from the real cart so the badge number stays
    // in sync after the edit is discarded.
    return {
      ...state,
      PRODUCT,
      counter: recalculateCounter(PRODUCT)
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
      case SalesActionTypes.REMOVE_PRODUCT_TO_CART: {
        const nextProducts = state?.PRODUCT?.filter((t: Product) => {
          return t.pId !== action?.payload.pId
        }) ?? []
        return {
          ...state,
          PRODUCT: nextProducts,
          counter: recalculateCounter(nextProducts)
        }
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
          counter: 0,
          discountType: TypeDiscount.PERCENT,
          discountPercent: 0,
          discountAmount: 0,
          discountBreakdown: []
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
          pId: action.payload as string,
          deleteValue: false,
          value: values.comment,
          sendNotification,
          setOpenCommentModal,
          openCommentModal
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
      case SalesActionTypes.RESTORE_PENDING_ORDER: {
        const payload = action.payload
        const restoredProducts = Array.isArray(payload?.products)
          ? payload.products
          : []

        return {
          ...state,
          PRODUCT: restoredProducts,
          counter: recalculateCounter(restoredProducts),
          discountType: payload.discountType
            ? payload.discountType as TypeDiscount
            : TypeDiscount.PERCENT,
          discountPercent: Number.isFinite(payload.discountPercent)
            ? Math.max(0, payload.discountPercent)
            : 0,
          discountAmount: Number.isFinite(payload.discountAmount)
            ? Math.max(0, payload.discountAmount)
            : 0,
          discountBreakdown: []
        }
      }
      default:
        return state
    }
  }

  const [data, dispatch] = useReducer<React.Reducer<SalesState, SalesReducerAction>, SalesState>(PRODUCT, initialStateSales, initializer)


  const [activePendingOrderId, setActivePendingOrderId] = useState<string | null>(null)

  const {
    pendingOrders,
    activePendingOrders,
    pendingOrdersCount,
    isPendingOrdersReady,
    canPersistPendingOrders,
    savePendingOrder,
    resumePendingOrder,
    removePendingOrder,
    updatePendingOrder,
    updatePendingStatus,
    clearPendingOrders,
    persistPendingOrder,
    searchPendingOrders
  } = usePendingOrders({
    persistence: pendingOrdersPersistence,
    onError: (message) => {
      sendNotification({
        title: 'Orden pendiente',
        backgroundColor: 'error',
        description: message
      })
    }
  })

  const handleAddOptional = ({ exOptional = null, codeCategory = null }) => {
    if (!exOptional || !codeCategory) return
    const item = dataOptional.find((item) => { return item.code === codeCategory })
    if (!item) return
    const idx = item.ExtProductFoodsSubOptionalAll.findIndex(
      (el: any) => { return el.opSubExPid === exOptional }
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
   * Updates all extra and optional products for the current product.
   * @returns {void}
   */
  function handleUpdateAllExtra(): void {
    if (!product?.PRODUCT?.pId) {
      sendNotification({
        title: 'Error',
        backgroundColor: 'error',
        description: 'Ha ocurrido un error'
      })
      return
    }
    const filteredDataOptional = dataOptional
      .map((obj) => {
        const filteredSubOptions = obj?.ExtProductFoodsSubOptionalAll?.filter(
          (subObj: any) => subObj?.check === true
        )
        // Exclude parent object if filteredSubOptions is empty
        if (!filteredSubOptions || filteredSubOptions.length === 0) {
          return null
        }
        return { ...obj, ExtProductFoodsSubOptionalAll: filteredSubOptions }
      })
      .filter(Boolean) // Remove all null objects from array

    const filteredDataExtra = dataExtra?.filter((p) => p?.quantity !== undefined && p?.quantity !== 0)
    if (product?.PRODUCT?.pId) {
      dispatch({
        type: SalesActionTypes.PUT_EXTRA_PRODUCTS_AND_OPTIONAL_PRODUCT,
        payload: product.PRODUCT.pId,
        dataOptional: filteredDataOptional,
        dataExtra: filteredDataExtra
      })
      const updatesOccurred = (dataExtra && dataExtra.length > 0)
      if (updatesOccurred) {
        sendNotification({
          title: 'Success',
          backgroundColor: 'success',
          description: 'Items subidos al producto'
        })
      }
    }
  }

  /**
   *
   * @param root0
   * @param root0.Adicionales
   * @param root0.index
   */
  function handleIncrementExtra({ Adicionales }: { Adicionales: any }) {
    const { pId } = product?.PRODUCT || {}
    const exPid = Adicionales?.exPid || null

    if (exPid && pId) {
      // Stock guard for complementos. Only extras that manage inventory are
      // limited; extras with manageStock=false are unlimited. The available
      // units are the extra's current `stock`; the already-selected `quantity`
      // counts against it, so a user can never select more than is on hand.
      // The backend re-validates on registerSalesStore (source of truth); this
      // is an early, friendly block that mirrors that rule.
      const current = dataExtra.find((p) => { return p.exPid === exPid })
      const managesStock = Boolean(current?.manageStock)
      const available = Number(current?.stock ?? 0)
      const selected = Number(current?.quantity ?? 0)
      if (managesStock && selected >= available) {
        sendNotification({
          title: 'Sin stock disponible',
          backgroundColor: 'warning',
          description: available > 0
            ? `"${current?.extraName ?? 'Complemento'}" solo tiene ${available} unidad(es) disponible(s).`
            : `"${current?.extraName ?? 'Complemento'}" no tiene stock disponible.`
        })
        return
      }

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

  /**
   * Remove an added complement from the current selection.
   *
   * POS semantics: resets the extra's selected quantity to 0 so it no longer
   * contributes to the product total, while keeping it in the list (and keeping
   * its unit price) so the operator can add it again.
   *
   * @param exPid - the extra product id to reset. Can be passed directly or via
   *   an `Adicionales` object, matching the increment/decrement handler shape.
   */
  const handleRemoveExtra = (arg: any) => {
    const exPid = arg?.Adicionales?.exPid ?? arg?.exPid ?? arg
    if (!exPid) return
    setDataExtra((prev) => { return removeExtra(prev as any, exPid) })
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

  // Removed unused handleList function



  const arrayProduct = useMemo(() => {
    if (!Array.isArray(data.PRODUCT) || data.PRODUCT.length === 0) return []
    return data.PRODUCT.map((product: any) => {
      // Only include complementos the customer actually selected (quantity >= 1).
      // Extras that live in the product's list but were never added have
      // quantity null/0; sending them makes the backend validator reject the
      // whole sale ("dataExtra[n].quantity is required"). Filtering here keeps
      // the payload to the real selection.
      const filteredDataExtra = (product?.dataExtra ?? [])
        .filter((extra: any) => Number(extra?.quantity) >= 1)
        .map(({ ...rest }) => ({ ...rest }))
      const dataOptional = (product?.dataOptional ?? []).map(({ ...rest }) => {
        const { ExtProductFoodsSubOptionalAll, ...r } = rest
        const adjusted = (ExtProductFoodsSubOptionalAll ?? []).map((s: any) => ({ ...s }))
        return { ...r, ExtProductFoodsSubOptionalAll: adjusted }
      })
      return {
        pId: product.pId,
        refCodePid: RandomCode(20),
        id: values?.cliId,
        cantProducts: Number.parseInt(String(product?.ProQuantity ?? 0)),
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

  /**
   * Sums ProPrice and totalExtra for each item.
   * @param data
   * @returns Array with totalExtra and total for each item.
   */
  function sumProPriceAndTotalExtra(data: { dataExtra: { newExtraPrice: string }[]; ProPrice: number }[]) {
    return data.map((item) => {
      const totalExtra = item.dataExtra.reduce((acc, curr) => {
        const newExtraPrice = Number.parseFloat(curr.newExtraPrice)
        if (Number.isNaN(newExtraPrice)) {
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
    let runningTotal = 0
    dataCountTotal.forEach((a: { total: number }) => {
      const { total } = a || {}
      runningTotal += total
    })
    setTotalProductPrice(Math.max(0, runningTotal))
    if (data.PRODUCT.length === 0) {
      setTotalProductPrice(0)
    }
  }, [data, finalArrayProduct])

  const client = useApolloClient()
  const { getOneSalesStore } = useGetSale()
  // Removed console.log(data)
  // Safe monetary converter: strips thousand-separator dots then parses as float,
  // rounds to the nearest integer (Colombian peso — no cents in this POS).
  // parseInt was previously used here but is unsafe because parseInt('10.500', 10)
  // returns 10 instead of 10500.
  const convertInteger = (cadena: string | number): number => {
    if (typeof cadena === 'number') return Number.isFinite(cadena) ? Math.round(cadena) : 0
    if (typeof cadena !== 'string' || cadena.trim() === '') return 0
    // Strip thousand-separator dots (Colombian locale uses '.' as thousands sep)
    const cleaned = cadena.trim().replace(/\./g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    return Number.isFinite(parsed) ? Math.round(parsed) : 0
  }
  const handleSubmit = () => {
    // Double-submit guard: prevent a second mutation while one is already in-flight.
    if (loadingSale || loadingRegisterSale) return

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

    setCode(code)
    // convertInteger moved to outer scope above
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

    // Snapshot del carrito en el momento del envío. Se usa en update() para
    // descontar el stock en caché; `data.PRODUCT` conserva cantidades y extras
    // seleccionados y puede limpiarse tras el éxito, así que lo fijamos aquí.
    const soldProducts: Product[] = Array.isArray(data?.PRODUCT)
      ? [...data.PRODUCT]
      : []

    const input = stripTypename(
      finalArrayProduct.map((item) => ({
        ...item,
        shoppingCartRefCode
      }))
    )
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
          type: data.discountType ? String(data.discountType) : TypeDiscount.PERCENT,
          value: data.discountAmount ?? 0
        },
        totalProductsPrice: convertInteger(totalProductsPrice) || 0
      },
      update(cache, { data: mutationData }) {
        // Solo descontamos stock en caché cuando el backend confirmó la venta.
        // El backend es la fuente de verdad del inventario; esto mantiene la UI
        // del POS sincronizada sin re-fetch, descontando por producto (pId) y
        // por complemento/extra (exPid) las unidades vendidas. `soldProducts`
        // se toma del carrito actual (data.PRODUCT) porque conserva las
        // cantidades y los extras seleccionados.
        const wasSuccessful = Boolean(
          mutationData?.registerSalesStore?.success
        )
        if (!wasSuccessful) return
        updateStockCacheAfterSale(cache, soldProducts)
      }
    })
      .then((response) => {
        if (response) {
          const { data } = response
          const { registerSalesStore } = data ?? {}
          const { success } = registerSalesStore ?? {}
          if (success) {
            setPrint(false)

            // Complete a resumed order only after the backend confirms the sale.
            if (activePendingOrderId) {
              updatePendingStatus(activePendingOrderId, 'COMPLETED')
              setActivePendingOrderId(null)
            }

            client.query({
              query: GET_ALL_COUNT_SALES,
              fetchPolicy: 'network-only'
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
                if (!inComingCodeRef) return
              }
            })
            onSaleSuccess({
              code: code
            })
            handleQuery('sale', code)
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
      const originalArray = data.PRODUCT.find((item: Product) => item.pId === pId)
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
            // Exclude parent object if filteredSubOptions is empty
            if (!filteredSubOptions || filteredSubOptions.length === 0) {
              return null
            }
            return {
              ...obj,
              ExtProductFoodsSubOptionalAll: filteredSubOptions
            }
          })
          .filter(Boolean)
        : []

      // Update optionalAll.data.ExtProductFoodsSubOptionalAll with updated values from originalArray2.ExtProductFoodsSubOptionalAll
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
                    (newItem: any) => newItem && newItem.opSubExPid === subObj.opSubExPid
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
          .filter(Boolean)
        if (existOptionalCookies) {
          setDataOptional(updateOption || [])
        } else {
          setDataOptional(optionalAll.data.ExtProductFoodsOptionalAll || [])
        }
      }
      // NO OPTIONAL
      const extProduct = await ExtProductFoodsAll({ variables: { pId } })
      let finalData
      if (originalArray?.dataExtra) {
        const filteredData = originalArray.dataExtra.filter((item: any) => {
          return extProduct?.data?.ExtProductFoodsAll.some(
            (newItem: any) => newItem.exPid === item.exPid
          )
        })
        finalData = originalArray?.dataExtra?.concat(
          extProduct?.data?.ExtProductFoodsAll?.filter(
            (item: any) => {
              return !filteredData?.some(
                (filteredItem: any) => filteredItem.exPid === item.exPid
              )
            }
          )
        )
      } else {
        finalData = extProduct?.data?.ExtProductFoodsAll
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
        sendNotification({
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
    const cartMap = new Map(data?.PRODUCT?.map((item: any) => { return [String(item.pId), item] }))

    return filteredProducts.map(product => {
      const cartItem = cartMap.get(String(product.pId))
      return {
        ...product,
        existsInSale: cartMap.has(String(product.pId)),
        ProQuantity: cartItem?.ProQuantity || 0,
        editing: cartItem?.editing ?? false,
        oldQuantity: cartItem?.oldQuantity
      }
    })
  }, [data.PRODUCT, filteredProducts])

  const totalProductsPrice = useMemo(() => { return finalArrayProduct.reduce((acc: number, item: Product) => { return acc + (Number(item.ProPrice) || 0) + (Number(item.totalExtra) || 0) }, 0) }, [finalArrayProduct])


  /**
   * Parks the current cart, or updates the same order if it was resumed earlier.
   * The cart is cleared only after the local snapshot has been persisted.
   *
   * @param {Partial<Omit<PendingOrderCustomer, 'id'>>} customerDetails - Optional customer details.
   * @returns {PendingOrder | null} Saved order, or null when saving fails.
   */
  const handleSavePendingOrder = (
    customerDetails: Partial<Omit<PendingOrderCustomer, 'id'>> = {}
  ): PendingOrder | null => {
    if (!Array.isArray(data?.PRODUCT) || data.PRODUCT.length === 0) {
      sendNotification({
        title: 'Orden pendiente',
        backgroundColor: 'warning',
        description: 'Agrega al menos un producto antes de enviar la orden a espera.'
      })
      return null
    }

    const customerHasDetails = Object.values(customerDetails).some(Boolean)
    const customer: PendingOrderCustomer | null = values.cliId || customerHasDetails
      ? { id: values.cliId || null, ...customerDetails }
      : null

    const snapshot = {
      products: data.PRODUCT,
      values: { ...values },
      total: totalProductsPrice,
      discountType: data.discountType ? String(data.discountType) : String(TypeDiscount.PERCENT),
      discountPercent: Number(data.discountPercent) || 0,
      discountAmount: Number(data.discountAmount) || 0,
      customer
    }

    const activeOrder = pendingOrders.find(
      (order) => order.id === activePendingOrderId && order.status === 'IN_PROGRESS'
    )

    const order = activeOrder
      ? updatePendingOrder(activeOrder.id, { ...snapshot, status: 'PENDING' })
      : savePendingOrder(snapshot)

    if (!order) return null

    dispatch({ type: SalesActionTypes.REMOVE_ALL_PRODUCTS })
    setValues(initialValuesState)
    setActivePendingOrderId(null)

    sendNotification({
      title: 'Orden en espera',
      backgroundColor: 'success',
      description: activeOrder
        ? `La orden ${order.ticket} fue actualizada y devuelta a la lista de espera.`
        : `La orden ${order.ticket} fue enviada a la lista de espera.`
    })

    return order
  }

  /**
   * Restores a pending-order snapshot to the POS cart.
   * Set replaceCurrent=true only after the UI has confirmed replacing a non-empty cart.
   *
   * @param {string} orderId - Pending order ID.
   * @param {boolean} replaceCurrent - Whether to replace a non-empty current cart.
   * @returns {boolean} Whether the order was resumed successfully.
   */
  const handleResumePendingOrder = (
    orderId: string,
    replaceCurrent = false
  ): boolean => {
    const order = pendingOrders.find((item) => item.id === orderId)

    if (!order || !['PENDING', 'IN_PROGRESS'].includes(order.status)) {
      sendNotification({
        title: 'Orden pendiente',
        backgroundColor: 'error',
        description: 'La orden no existe o ya no se puede retomar.'
      })
      return false
    }

    if (data.PRODUCT.length > 0 && !replaceCurrent) {
      sendNotification({
        title: 'Carrito ocupado',
        backgroundColor: 'warning',
        description: 'Confirma el reemplazo del carrito actual antes de retomar esta orden.'
      })
      return false
    }

    const resumedOrder = resumePendingOrder(order.id)
    if (!resumedOrder) return false

    dispatch({
      type: SalesActionTypes.RESTORE_PENDING_ORDER,
      payload: {
        products: resumedOrder.products,
        discountType: resumedOrder.discountType || String(TypeDiscount.PERCENT),
        discountPercent: resumedOrder.discountPercent,
        discountAmount: resumedOrder.discountAmount
      }
    })

    setValues({ ...resumedOrder.values })
    setActivePendingOrderId(resumedOrder.id)

    sendNotification({
      title: 'Orden retomada',
      backgroundColor: 'success',
      description: `La orden ${resumedOrder.ticket} fue restaurada al carrito.`
    })

    return true
  }

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
    discount: data.discountAmount ?? 0,
    discountPercent: data.discountPercent ?? 0,
    discountAmount: data.discountAmount ?? 0,
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
            const result = await handleGetOneProduct({ variables: { pId } } as any)
            if (result && result.data && 'productFoodsOne' in result.data) {
              return { data: { productFoodsOne: result.data.productFoodsOne as Product | null } }
            }
            return { data: { productFoodsOne: null } }
          }
          throw new Error('handleGetOneProduct is not a function')
        }
      })
    },
    handleRemoveValue: (params: { name: string; pId: string; value: string | null }) => {
      return handleRemoveComment({
        ...params,
        values,
        setValues,
        sendNotification,
        dispatch
      })
    },
    setDelivery,
    setValues,
    setShowMore,
    PriceRangeFunc,
    handleCleanFilter,
    handleSubmit,
    handleChangeFilterProduct,
    handleDecrementExtra,
    handleRemoveExtra,
    setTotalProductPrice,
    setInputValue,
    getSortedProduct,
    handleAddOptional,
    handleIncrementExtra,
    setProduct,
    setPrint: handlePrint,
    PRODUCT,

    // Filtros del modal (reusables)
    appliedFilters,
    handleApplyFilters,
    handleClearFilters,

    // Pending orders
    activePendingOrderId,
    handleSavePendingOrder,
    handleResumePendingOrder,
    pendingOrders,
    activePendingOrders,
    pendingOrdersCount,
    isPendingOrdersReady,
    canPersistPendingOrders,
    resumePendingOrder,
    removePendingOrder,
    updatePendingOrder,
    updatePendingStatus,
    clearPendingOrders,
    persistPendingOrder,
    searchPendingOrders
  }
}