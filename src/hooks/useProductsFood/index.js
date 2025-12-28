import {
  useApolloClient,
  useLazyQuery,
  useMutation,
  useQuery
} from '@apollo/client'
import { useCallback, useMemo, useState } from 'react'
import {
  GET_ALL_EXTRA_PRODUCT,
  GET_ALL_PRODUCT_STORE,
  GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
  GET_ONE_PRODUCTS_FOOD,
  UPDATE_PRODUCT_FOOD
} from './queriesStore'
import { useStockUpdatedAllSubscription } from '../useStock'
export * from './useEditProduct'

export const useProductsFood = ({
  idStore = null,
  categories = [],
  desc = [],
  fetchPolicy = 'cache-and-network',
  fromDate = null,
  gender = [],
  max = 100,
  min = null,
  pState,
  search = null,
  toDate = null,
  dataSale = [],
  isShopppingCard = false
}) => {
  const [showMore, setShowMore] = useState(500)
  const client = useApolloClient()
  const variables = useMemo(() => ({
    categories,
    desc,
    gender,
    max,
    min,
    pState,
    search
  }), [categories, desc, gender, max, min, pState, search])

  const { data, loading, fetchMore, refetch, error, called } = useQuery(GET_ALL_PRODUCT_STORE, {
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
    (payload) => {
      try {
        if (!payload || !payload.pId) return

        // Try to read current query result from cache (may throw if not present)
        const cached = client.readQuery({
          query: GET_ALL_PRODUCT_STORE,
          variables
        })

        if (!cached?.productFoodsAll?.data) return

        const updatedData = cached.productFoodsAll.data.map((prod) => {
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
        // eslint-disable-next-line no-console
        console.error('useProductsFood: failed updating cache from subscription', err)
      }
    },
    // include all variables that affect the cache key
    [client, JSON.stringify(variables)]
  )
  // Attach subscription only if idStore is provided (the subscription hook internally skips when idStore is falsy)
  useStockUpdatedAllSubscription(idStore ?? '', onStockUpdated)

  if (!isShopppingCard) {
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

  const updatedProductsFood = productsFood.map(product => ({
    ...product,
    existsInSale: Array.isArray(dataSale) && dataSale.some(item => item.pId === product.pId)
  }))

  return [
    updatedProductsFood,
    {
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

export const useDeleteProductsFood = ({
  sendNotification = (arg) => { return arg },
  onSuccess = (arg) => { return arg }
} = {
    sendNotification: (arg) => { return arg },
    onSuccess: (arg) => { return arg }
  }) => {
  const [updateProductFoods, { data, loading, error }] = useMutation(UPDATE_PRODUCT_FOOD)

  const handleDelete = async product => {
    const { pId, pState } = product || {}
    return await updateProductFoods({
      variables: {
        input: {
          pId,
          pState
        }
      },
      update(cache) {
        cache.modify({
          fields: {
            productFoodsAll(dataOld = []) {
              if (Array.isArray(dataOld) && dataOld?.length) {
                const product = dataOld?.find((product) => {
                  return product.pId === pId
                })
                if (product) {
                  const newProductList = dataOld?.filter((product) => {
                    return product?.pId !== pId
                  })
                  return newProductList
                }
                return dataOld
              } else {
                return []
              }
            }
          }
        })
        cache.modify({
          fields: {
            getCatProductsWithProduct(dataOld = []) {
              if (Array.isArray(dataOld?.catProductsWithProduct) && dataOld?.catProductsWithProduct?.length) {
                const newListCatProducts = dataOld?.catProductsWithProduct?.map((categories) => {
                  return {
                    ...categories,
                    productFoodsAll: categories?.productFoodsAll?.length
                      ? categories?.productFoodsAll?.filter((product) => {
                        return product?.pId !== pId
                      })
                      : []
                  }
                })
                return {
                  catProductsWithProduct: newListCatProducts,
                  totalCount: newListCatProducts?.length
                }
              }
              return dataOld
            }
          }
        })
      }
    }).then(() => {
      onSuccess()
      return sendNotification({
        title: 'Éxito',
        description: pState === 1 ? 'El producto se ha eliminado correctamente' : 'El producto se ha restaurando correctamente',
        backgroundColor: 'success'
      })
    }).catch((e) => {
      console.log(e)
      return sendNotification({
        title: 'Error',
        description: 'Ocurrió un error',
        backgroundColor: 'error'
      })
    })
  }
  return {
    handleDelete, data, loading, error
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

  const handleExtProductFoodsAll = (pId) => {
    if (!pId) return
    return ExtProductFoodsAll({
      variables: {
        pId
      }
    })
  }
  return [handleExtProductFoodsAll,
    {
      data: data?.ExtProductFoodsAll || [],
      loading,
      error
    }
  ]
}

export const useExtProductFoodsOptionalAll = () => {
  const [ExtProductFoodsOptionalAll,
    {
      data,
      loading,
      error
    }] = useLazyQuery(GET_EXTRAS_PRODUCT_FOOD_OPTIONAL)

  const handleGetExtProductFood = (pId) => {
    try {
      ExtProductFoodsOptionalAll({
        variables: {
          pId
        }
      })
    } catch (e) {
      console.log(e)
    }
  }
  return [handleGetExtProductFood,
    {
      data: data?.ExtProductFoodsOptionalAll || [],
      loading,
      error
    }]
}

export const useGetOneProductsFood = ({ fetchOnlyProduct = false } = {}) => {
  const [productFoodsOne,
    {
      data,
      loading,
      error
    }] = useLazyQuery(GET_ONE_PRODUCTS_FOOD)

  const [handleGetExtProductFood, { data: dataOptional }] = useExtProductFoodsOptionalAll()
  const [handleExtProductFoodsAll, { data: dataExtra }] = useExtProductFoodsAll()
  const handleGetOneProduct = async (food) => {
    const { pId } = food
    try {
      const product = await productFoodsOne({
        variables: {
          pId
        }
      })
      if (!fetchOnlyProduct) handleGetExtProductFood(pId)
      if (!fetchOnlyProduct) handleExtProductFoodsAll(pId)
      return product
    } catch (e) {
      console.log(e)
    }
  }
  const handleFunctionQuery = fetchOnlyProduct ? productFoodsOne : handleGetOneProduct
  return [handleFunctionQuery, {
    data: data?.productFoodsOne || {},
    dataExtra,
    dataOptional,
    loading,
    error
  }]
}
