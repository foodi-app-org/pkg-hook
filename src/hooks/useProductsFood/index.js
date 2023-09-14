import {
  useLazyQuery,
  useMutation,
  useQuery
} from '@apollo/client'
import { useState } from 'react'
import {
  GET_ALL_CATEGORIES_WITH_PRODUCT,
  GET_ALL_EXTRA_PRODUCT,
  GET_ALL_PRODUCT_STORE,
  GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
  GET_ONE_PRODUCTS_FOOD,
  UPDATE_PRODUCT_FOOD
} from './queriesStore'
export * from './useEditProduct'

/**
 * Description
 * @param {any} categories
 * @param {any} desc
 * @param {any} fetchPolicy='network-only'
 * @param {any} fromDate
 * @param {any} gender
 * @param {any} max=50
 * @param {any} min
 * @param {any} pState
 * @param {any} search=null
 * @param {any} toDate
 * @returns {any}
 */
export const useProductsFood = ({
  categories,
  desc,
  fetchPolicy = 'network-only',
  fromDate,
  gender,
  max = 50,
  min,
  pState,
  search = null,
  toDate
}) => {
  // const [productsFood, setProductsFood] = useState([])
  const [showMore, setShowMore] = useState(50)
  const { data, loading, fetchMore, error, called } = useQuery(GET_ALL_PRODUCT_STORE, {
    fetchPolicy: fetchPolicy ?? 'cache-and-network',
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
      pState: pState || 0,
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

export const useDeleteProductsFood = ({ sendNotification = () => { } } = {}) => {
  const [updateProductFoods, { data, loading, error }] = useMutation(UPDATE_PRODUCT_FOOD)

  const handleDelete = product => {
    const { pId, pState } = product || {}
    updateProductFoods({
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
              return cache.writeQuery({ query: GET_ALL_PRODUCT_STORE, data: dataOld })
            }
          }
        })
        cache.modify({
          fields: {
            getCatProductsWithProduct (dataOld = []) {
              return cache.writeQuery({ query: GET_ALL_CATEGORIES_WITH_PRODUCT, data: dataOld })
            }
          }
        })
      }
    }).then(() => {
      return sendNotification({
        title: 'Success',
        description: 'El producto se ha eliminado correctamente',
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
