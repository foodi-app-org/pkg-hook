import { useQuery } from '@apollo/client'

import { GET_ALL_CATEGORIES_WITH_PRODUCT } from './queries'
import { GetCatProductsWithProductResponse, ICatWithProduct } from './types'

export const useCatWithProduct = ({
  max = 400,
  min = 0,
  search = null,
  productName = null,
  searchFilter = {},
  callback = () => {}
}: ICatWithProduct) => {
  const {
    gender,
    desc,
    speciality
  } = searchFilter ?? {
    gender: [],
    desc: null,
    speciality: []
  }
  const {
    data,
    loading,
    error,
    fetchMore
  } = useQuery(GET_ALL_CATEGORIES_WITH_PRODUCT, {
    onCompleted: (data) => {
      callback(data as GetCatProductsWithProductResponse)
    },
    fetchPolicy: 'network-only',
    variables:
    {
      search,
      productName,
      gender,
      min,
      max,
      desc,
      categories: speciality
    }
  })
  const totalCount = data?.getCatProductsWithProduct?.totalCount
  return [
    data?.getCatProductsWithProduct?.catProductsWithProduct,
    {
      loading,
      error,
      fetchMore,
      totalCount
    }
  ]
}
