import {
  useApolloClient,
  useLazyQuery,
  useMutation,
  useQuery
} from '@apollo/client'
import { useCallback, useMemo, useState } from 'react'


import { useStockUpdatedAllSubscription } from '../useStock'

import {
  FIND_PRODUCT_BY_BARCODE,
  GET_ALL_EXTRA_PRODUCT,
  GET_ALL_PRODUCT_STORE,
  GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
  GET_ONE_PRODUCTS_FOOD,
  UPDATE_PRODUCT_FOOD
} from './queriesStore'

import type { Product } from 'typesdefs'
export * from './useEditProduct'

interface UseProductsFoodOptions {
  idStore?: string | null
  categories?: string[]
  desc?: string[]
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'no-cache'
  fromDate?: string | null
  gender?: string[]
  max?: number
  min?: number | null
  pState?: number
  search?: string | null
  isShopppingCard?: boolean | null
  toDate?: string | null
  dataSale?: Array<{ pId: string }>
  isShoppingCard?: boolean
  priceMin?: number | null
  priceMax?: number | null
  orderBy?: string[]
  callback: (args: any) => void
}
export const useProductsFood = ({
  idStore = null,
  categories = [],
  desc = [],
  fetchPolicy = 'cache-and-network',
  // fromDate = null, // removed unused variable
  gender = [],
  max = 100,
  min = null,
  pState,
  search = null,
  isShopppingCard = null,
  // toDate = null, // removed unused variable
  dataSale = [],
  isShoppingCard = false,
  priceMin = null,
  priceMax = null,
  orderBy = [],
  callback
}: UseProductsFoodOptions) => {
  const [showMore, setShowMore] = useState(500)
  const client = useApolloClient()
  const variables = useMemo(() => {return {
    categories,
    desc,
    gender,
    max,
    min,
    pState,
    search,
    priceMin,
    priceMax,
    orderBy
  }}, [categories, desc, gender, max, min, pState, search, priceMin, priceMax, orderBy, callback])

  const { data, loading, fetchMore, refetch, error, called } = useQuery(GET_ALL_PRODUCT_STORE, {
    onCompleted: (data) => {
      callback(data)
    },
    fetchPolicy,
    notifyOnNetworkStatusChange: true,
    nextFetchPolicy: 'cache-first',
    refetchWritePolicy: 'merge',
    variables
  })

  const productsFood = data?.productFoodsAll?.data ?? []
  /**
   * Callback when subscription emits a stock update.
   * Updates Apollo cache for GET_ALL_PRODUCT_STORE with same variables so UI updates reactively.
   */
  const onStockUpdated = useCallback(
    (payload: any) => {
      try {
        if (!payload || !payload.pId) return

        // Try to read current query result from cache (may throw if not present)
        const cached = client.readQuery({
          query: GET_ALL_PRODUCT_STORE,
          variables
        })

        if (!cached?.productFoodsAll?.data) return

        const updatedData = cached.productFoodsAll.data.map((prod: any) => {
          if (!prod || prod.pId !== payload.pId) return prod

          // update stock in-place preserving other fields; prefer 'stock' field name but keep others
          return {
            ...prod,
            // if your product model uses another field name replace 'stock' accordingly
            stock: payload.newStock,
            previousStock: payload.previousStock ?? prod.previousStock ?? null,
            // keep a meta object with event info for UI if needed
            lastStockEvent: {
              event: payload.event,
              meta: payload.meta
            }
          }
        })

        // Write back to cache so queries using GET_ALL_PRODUCT_STORE update automatically
        client.writeQuery({
          query: GET_ALL_PRODUCT_STORE,
          variables,
          data: {
            ...cached,
            productFoodsAll: {
              ...cached.productFoodsAll,
              data: updatedData
            }
          }
        })
      } catch (err) {
        // be silent but log for debugging
        // (don't throw — subscription should not break the app)
         
        console.error('useProductsFood: failed updating cache from subscription', err)
      }
    },
    // include all variables that affect the cache key
    [client, JSON.stringify(variables)]
  )
  // Attach subscription only if idStore is provided (the subscription hook internally skips when idStore is falsy)
  useStockUpdatedAllSubscription(idStore ?? '', onStockUpdated)

  if (!isShoppingCard) {
    return [
      productsFood, {
        pagination: data?.productFoodsAll?.pagination || {},
        loading: called ? false : loading,
        error,
        showMore,
        fetchMore,
        refetch,
        setShowMore
      }
    ]
  }

  const updatedProductsFood = productsFood.map((product: any) => {return {
    ...product,
    existsInSale: Array.isArray(dataSale) && dataSale.some(item => {return item.pId === product.pId})
  }})

  return [
    updatedProductsFood,
    {
      pagination: data?.productFoodsAll?.pagination || {},
      loading: called ? false : loading,
      error,
      isShopppingCard,
      showMore,
      fetchMore,
      refetch,
      setShowMore
    }
  ]
}

interface UseDeleteProductsFoodOptions {
  sendNotification?: NotificationFn;
  onSuccess?: SuccessFn;
}


export const PRODUCT_DELETED_FROM_CART_EVENT =
  'pos:product-deleted-from-cart'

type NotificationFn = (args: {
  title: string
  description: string
  backgroundColor: string
}) => any

type SuccessFn = (args?: any) => any

interface UseDeleteProductsFoodOptions {
  sendNotification?: NotificationFn
  onSuccess?: SuccessFn
}

/**
 * Recalcula el contador del carrito utilizando las cantidades reales.
 */
const calculateCartCounter = (products: any[]): number => {
  return products.reduce((total, product) => {
    const quantity = Number(product?.ProQuantity)

    return total + (
      Number.isFinite(quantity) && quantity > 0
        ? quantity
        : 0
    )
  }, 0)
}

/**
 * Elimina un producto de la cookie del carrito.
 *
 * No modifica otras propiedades del estado persistido.
 */
const removeProductFromSalesCookie = (pId: string): boolean => {
  const cookieKey = process.env.NEXT_LOCAL_SALES_STORE

  if (!cookieKey) {
    console.error(
      'useDeleteProductsFood: NEXT_LOCAL_SALES_STORE no está configurada.'
    )
    return false
  }

  try {
    const cookieValue = Cookies.get(cookieKey)

    if (!cookieValue) return false

    const savedState = JSON.parse(cookieValue)

    if (
      !savedState ||
      typeof savedState !== 'object' ||
      Array.isArray(savedState) ||
      !Array.isArray(savedState.PRODUCT)
    ) {
      return false
    }

    const currentProducts = savedState.PRODUCT

    const nextProducts = currentProducts.filter(
      (product: any) => product?.pId !== pId
    )

    // Evitamos reescribir la cookie cuando no existe el producto.
    if (nextProducts.length === currentProducts.length) {
      return false
    }

    const nextState = {
      ...savedState,
      PRODUCT: nextProducts,
      counter: calculateCartCounter(nextProducts)
    }

    const domain = getCurrentDomain()

    Cookies.set(cookieKey, JSON.stringify(nextState), {
      domain: typeof domain === 'string' ? domain : undefined,
      path: '/'
    })

    return true
  } catch (error) {
    console.error(
      'useDeleteProductsFood: error eliminando producto de la cookie',
      error
    )

    return false
  }
}

/**
 * Hook responsable de actualizar el estado de un producto.
 *
 * Orquesta:
 * 1. Actualización GraphQL.
 * 2. Invalidación de caché Apollo.
 * 3. Limpieza de cookie cuando se elimina.
 * 4. Sincronización con el reducer del carrito.
 * 5. Notificaciones y callback.
 */
export const useDeleteProductsFood = ({
  sendNotification = (args) => args,
  onSuccess = (args) => args
}: UseDeleteProductsFoodOptions = {}) => {
  const client = useApolloClient()

  const [
    updateProductFoods,
    { data, loading, error }
  ] = useMutation(UPDATE_PRODUCT_FOOD)

  /**
   * Invalida las consultas afectadas.
   *
   * Se eliminan todas las variantes cacheadas de las listas para evitar
   * conservar productos en consultas con diferentes filtros o páginas.
   */
  const invalidateProductCache = useCallback(async () => {
    client.cache.batch({
      update(cache) {
        cache.evict({
          id: 'ROOT_QUERY',
          fieldName: 'productFoodsAll'
        })

        cache.evict({
          id: 'ROOT_QUERY',
          fieldName: 'getCatProductsWithProduct'
        })

        cache.evict({
          id: 'ROOT_QUERY',
          fieldName: 'productFoodsOne'
        })
      }
    })

    client.cache.gc()

    // Actualiza las consultas activas relacionadas con productos.
    await client.refetchQueries({
      include: [
        GET_ALL_PRODUCT_STORE,
        GET_ONE_PRODUCTS_FOOD
      ]
    })
  }, [client])

  /**
   * Elimina o restaura un producto.
   *
   * pState === 1: eliminación.
   * Otros estados: restauración.
   */
  const handleDelete = useCallback(
    async (product: Product) => {
      const { pId, pState } = product || {}

      if (!pId) {
        sendNotification({
          title: 'Error',
          description: 'No se encontró el identificador del producto.',
          backgroundColor: 'error'
        })

        return null
      }

      const isDeleting = Number(pState) === 1

      let response: any

      // =====================================================
      // 1. ACTUALIZAR BACKEND
      // =====================================================

      try {
        response = await updateProductFoods({
          variables: {
            input: {
              pId,
              pState
            }
          },
          errorPolicy: 'none'
        })

        const responseData = response?.data as
          | Record<string, any>
          | undefined

        if (!responseData) {
          throw new Error(
            'El servidor no confirmó la actualización del producto.'
          )
        }

        const mutationResult = Object.values(responseData)[0] as any

        if (
          mutationResult === null ||
          mutationResult === false ||
          mutationResult?.success === false
        ) {
          throw new Error(
            mutationResult?.message ||
            'No fue posible actualizar el producto.'
          )
        }
      } catch (mutationError) {
        console.error(
          'useDeleteProductsFood: error actualizando producto',
          mutationError
        )

        sendNotification({
          title: 'Error',
          description:
            mutationError instanceof Error
              ? mutationError.message
              : 'No fue posible actualizar el producto.',
          backgroundColor: 'error'
        })

        return null
      }

      // =====================================================
      // 2. ACTUALIZAR CACHE APOLLO
      // =====================================================

      try {
        await invalidateProductCache()
      } catch (cacheError) {
        // Un error de caché no revierte una operación confirmada
        // por el backend.
        console.error(
          'useDeleteProductsFood: error actualizando caché',
          cacheError
        )
      }

      // =====================================================
      // 3. ELIMINAR COOKIE Y SINCRONIZAR useSales
      // =====================================================

      if (isDeleting) {
        // Primera protección: eliminar directamente de la cookie.
        removeProductFromSalesCookie(pId)

        // Segunda protección: eliminar del reducer en memoria.
        // useSales recibirá el evento y actualizará el estado.
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent<{ pId: string }>(
              PRODUCT_DELETED_FROM_CART_EVENT,
              {
                detail: { pId }
              }
            )
          )
        }
      }

      // =====================================================
      // 4. CALLBACK DE ÉXITO
      // =====================================================

      try {
        await onSuccess(response)
      } catch (callbackError) {
        console.error(
          'useDeleteProductsFood: error ejecutando onSuccess',
          callbackError
        )
      }

      // =====================================================
      // 5. NOTIFICACIÓN
      // =====================================================

      sendNotification({
        title: 'Éxito',
        description: isDeleting
          ? 'El producto se ha eliminado correctamente'
          : 'El producto se ha restaurado correctamente',
        backgroundColor: 'success'
      })

      return response
    },
    [
      updateProductFoods,
      invalidateProductCache,
      onSuccess,
      sendNotification
    ]
  )

  return {
    handleDelete,
    data,
    loading,
    error
  }
}


export const useExtProductFoodsAll = () => {
  const [ExtProductFoodsAll,
    {
      data,
      loading,
      error
    }
  ] = useLazyQuery(GET_ALL_EXTRA_PRODUCT)

  const handleExtProductFoodsAll = (pId: string): void => {
    if (!pId) return;
    ExtProductFoodsAll({
      variables: {
        pId
      }
    });
  };
  return [
    handleExtProductFoodsAll,
    {
      data: data?.ExtProductFoodsAll || [],
      loading,
      error
    }
  ];
}

export const useExtProductFoodsOptionalAll = () => {
  const [ExtProductFoodsOptionalAll,
    {
      data,
      loading,
      error
    }] = useLazyQuery(GET_EXTRAS_PRODUCT_FOOD_OPTIONAL)

  const handleGetExtProductFood = (pId: string): void => {
    try {
      ExtProductFoodsOptionalAll({
        variables: {
          pId
        }
      });
    } catch (e) {
      console.error(e);
    }
  };
  return [handleGetExtProductFood,
    {
      data: data?.ExtProductFoodsOptionalAll || [],
      loading,
      error
    }]
}

interface UseGetOneProductsFoodOptions {
  fetchOnlyProduct?: boolean
}
export const useGetOneProductsFood = ({ fetchOnlyProduct = false }: UseGetOneProductsFoodOptions = {}) => {
  const [productFoodsOne,
    {
      data,
      loading,
      error
    }] = useLazyQuery(GET_ONE_PRODUCTS_FOOD)

    
  const extProductFoodsOptionalAll = useExtProductFoodsOptionalAll();
  const handleGetExtProductFood = extProductFoodsOptionalAll[0] as (pId: string) => void;
  const dataOptional = (extProductFoodsOptionalAll[1] as { data: any }).data;

  const extProductFoodsAll = useExtProductFoodsAll();
  const handleExtProductFoodsAll = extProductFoodsAll[0] as (pId: string) => void;
  const dataExtra = (extProductFoodsAll[1] as { data: any }).data;

  const handleGetOneProduct = async (food: Product) => {
    const { pId } = food;
    try {
      const product = await productFoodsOne({
        variables: {
          pId
        }
      });
      if (!fetchOnlyProduct) handleGetExtProductFood(pId);
      if (!fetchOnlyProduct) handleExtProductFoodsAll(pId);
      return product;
    } catch (e) {
      console.error(e);
      return undefined;
    }
  };
  const handleFunctionQuery = fetchOnlyProduct ? productFoodsOne : handleGetOneProduct
  return [handleFunctionQuery, {
    data: data?.productFoodsOne || {},
    dataExtra,
    dataOptional,
    loading,
    error
  }]
}

/** Estados diferenciados devueltos por la búsqueda por código de barras. */
export type FindByBarcodeStatus = 'FOUND' | 'NOT_FOUND' | 'INVALID' | 'ERROR'

export interface FindProductByBarcodeResult {
  success: boolean
  status: FindByBarcodeStatus
  message: string
  /** Código normalizado que consultó el backend (para precargar creación). */
  barcode: string
  data: Product | null
}

/**
 * Hook para buscar un producto por su código de barras contra el backend real
 * (query `findProductByBarcode`). La tienda la resuelve el backend desde la
 * sesión autenticada, por eso solo se envía el código.
 *
 * Expone una función `findByBarcode(code)` que devuelve el resultado
 * diferenciado (FOUND / NOT_FOUND / INVALID / ERROR), para que el controlador
 * de escaneo decida: agregar al carrito, ofrecer creación, o avisar error.
 *
 * @returns `{ findByBarcode, loading, error }` donde `findByBarcode(code)`
 *   resuelve un `FindProductByBarcodeResult`.
 */
export const useFindProductByBarcode = () => {
  const [runQuery, { loading, error }] = useLazyQuery(FIND_PRODUCT_BY_BARCODE, {
    fetchPolicy: 'network-only'
  })

  const findByBarcode = useCallback(
    async (code: string): Promise<FindProductByBarcodeResult> => {
      const ProBarCode = `${code ?? ''}`.trim()
      if (!ProBarCode) {
        return {
          success: false,
          status: 'INVALID',
          message: 'Código de barras vacío.',
          barcode: '',
          data: null
        }
      }
      try {
        const response = await runQuery({ variables: { ProBarCode } })
        const result = response?.data?.findProductByBarcode
        if (!result) {
          return {
            success: false,
            status: 'ERROR',
            message: 'No se pudo consultar el producto.',
            barcode: ProBarCode,
            data: null
          }
        }
        return result as FindProductByBarcodeResult
      } catch (e) {
        return {
          success: false,
          status: 'ERROR',
          message: e instanceof Error ? e.message : 'Error de conexión al buscar el producto.',
          barcode: ProBarCode,
          data: null
        }
      }
    },
    [runQuery]
  )

  return {
    findByBarcode,
    loading,
    error
  }
}
