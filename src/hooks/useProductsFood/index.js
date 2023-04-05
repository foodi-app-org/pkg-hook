import {
  useLazyQuery,
  useMutation,
  useQuery
} from '@apollo/client'
import { useEffect, useState } from 'react'
import {
  GET_ALL_EXTRA_PRODUCT,
  GET_ALL_PRODUCT_STORE,
  GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
  GET_ONE_PRODUCTS_FOOD,
  UPDATE_PRODUCT_FOOD
} from './queriesStore'

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
  const { data, loading, fetchMore, error } = useQuery(GET_ALL_PRODUCT_STORE, {
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
      loading,
      showMore,
      fetchMore,
      setShowMore
    }
  ]
}

export const useDeleteProductsFood = () => {
  const [updateProductFoods] = useMutation(UPDATE_PRODUCT_FOOD)

  const handleDelete = product => {
    const { pId, pState } = product || {}
    updateProductFoods({
      variables: {
        input: {
          pId,
          pState
        }
      }, update(cache) {
        cache.modify({
          fields: {
            productFoodsAll(dataOld = []) {
              return cache.writeQuery({ query: GET_ALL_PRODUCT_STORE, data: dataOld })
            }
          }
        })
        cache.modify({
          fields: {
            getCatProductsWithProduct(dataOld = []) {
              return cache.writeQuery({ query: GET_ALL_CATEGORIES_WITH_PRODUCT, data: dataOld })
            }
          }
        })
      }
    }).catch(err => { return console.log({ message: `${err}`, duration: 7000 }) })
  }
  return {
    handleDelete
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
    ExtProductFoodsAll({
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
    error,
  }]
}


export const useGetOneProductsFood = () => {
  const [productFoodsOne,
    {
    data,
    loading,
    error
}] = useLazyQuery(GET_ONE_PRODUCTS_FOOD)
  const [handleGetExtProductFood, { data: dataOptional }] = useExtProductFoodsOptionalAll()
  const [handleExtProductFoodsAll, { data: dataExtra }] = useExtProductFoodsAll()
  const handleGetOneProduct = (food) => {
    const { pId } = food
    try {
      productFoodsOne({
        variables: {
          pId: pId
        }
      })
      handleGetExtProductFood(pId)
      handleExtProductFoodsAll(pId)
    } catch (e) {
      console.log(e)
    }
  }
  return [handleGetOneProduct, {
    data: data?.productFoodsOne || {},
    dataExtra,
    dataOptional,
    loading,
    error,
  }]
}
