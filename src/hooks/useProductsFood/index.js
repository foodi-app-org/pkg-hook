import {
  useLazyQuery,
  useMutation,
  useQuery
} from '@apollo/client'
import { useState } from 'react'
import {
  GET_ALL_EXTRA_PRODUCT,
  GET_ALL_PRODUCT_STORE,
  GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
  GET_ONE_PRODUCTS_FOOD,
  UPDATE_PRODUCT_FOOD
} from './queriesStore'
export * from './useEditProduct'

export const useProductsFood = ({
  categories,
  desc,
  fetchPolicy = 'cache-and-network',
  fromDate,
  gender,
  max = 100,
  min,
  pState,
  search = null,
  toDate
}) => {
  // const [productsFood, setProductsFood] = useState([])
  const [showMore, setShowMore] = useState(500)
  const {
    data,
    loading,
    fetchMore,
    error,
    called
  } = useQuery(GET_ALL_PRODUCT_STORE, {
    fetchPolicy,
    notifyOnNetworkStatusChange: true,
    nextFetchPolicy: 'cache-first',
    refetchWritePolicy: 'merge',
    variables:
    {
      categories: categories || [],
      desc: desc || [],
      fromDate: fromDate || null,
      gender: gender || [],
      max: max || null,
      min: min || null,
      pState,
      search: search ?? search,
      toDate: toDate || null
    }
  })

  const productsFood = data?.productFoodsAll
  return [
    productsFood, {
      error,
      loading: called ? false : loading,
      showMore,
      fetchMore,
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
      update (cache) {
        cache.modify({
          fields: {
            productFoodsAll (dataOld = []) {
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
            getCatProductsWithProduct (dataOld = []) {
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
      productFoodsOne({
        variables: {
          pId
        }
      })
      if (!fetchOnlyProduct) handleGetExtProductFood(pId)
      if (!fetchOnlyProduct) handleExtProductFoodsAll(pId)
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
