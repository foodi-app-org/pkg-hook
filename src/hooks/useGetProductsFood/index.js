import { useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'
import { GET_ALL_PRODUCT_STORE } from './queriesStore'

export const useGetProductsFood = ({
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
  const [productsFood, setProductsFood] = useState([])
  const [showMore, setShowMore] = useState(50)
  const { data, loading, fetchMore, error } = useQuery(GET_ALL_PRODUCT_STORE, {
    fetchPolicy: fetchPolicy,
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
  useEffect(() => {
    setProductsFood(data?.productFoodsAll || [])
  }, [data, productsFood])
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