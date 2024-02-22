import { useQuery } from '@apollo/client'
import { GET_ALL_CATEGORIES_WITH_PRODUCT } from './queries'

export const useCatWithProduct = ({
  max = 1,
  min = 0,
  search = null,
  productName = null,
  searchFilter = {}
}) => {
  const {
    gender,
    desc,
    speciality
  } = searchFilter ?? {}
  const {
    data,
    loading,
    error,
    fetchMore
  } = useQuery(GET_ALL_CATEGORIES_WITH_PRODUCT, {
    onCompleted: (data) => {
      console.log('data', data)
    },
    fetchPolicy: 'network-only',
    variables:
    {
      search,
      productName,
      gender,
      min,
      max: 400,
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
