import { useQuery } from '@apollo/client'
import { GET_ALL_CATEGORIES_WITH_PRODUCT } from './queries'

export const useCatWithProduct = ({ 
    max = 1,
    min = 0,
    search = null, 
    searchFilter= {}
 }) => {
    const {
        gender,
        desc,
        speciality
    } = searchFilter || {}
  const {
    data,
    loading,
    error
} = useQuery(GET_ALL_CATEGORIES_WITH_PRODUCT, {
    fetchPolicy: 'network-only',
    variables:
    {
      search,
      gender: gender,
      min,
      max,
      desc: desc,
      categories: speciality
    }
  })

  return [data?.getCatProductsWithProduct, { loading, error }]
}