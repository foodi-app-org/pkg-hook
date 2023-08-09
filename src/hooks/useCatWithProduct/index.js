import { useQuery } from '@apollo/client'
import { GET_ALL_CATEGORIES_WITH_PRODUCT } from './queries'
import { useLogout } from '../useLogout'
import { errorHandler } from '../../config/client'

/**
 * Custom hook to fetch categories with products based on given parameters.
 *
 * @param {Object} options - The options object with parameters for the query.
 * @param {number} options.max - Maximum price for product filtering.
 * @param {number} options.min - Minimum price for product filtering.
 * @param {string|null} options.search - Search query for product names.
 * @param {string|null} options.productName - Name of the product to search for.
 * @param {Object} options.searchFilter - Additional filters for product search.
 * @param {string} options.searchFilter.gender - Gender filter for products.
 * @param {string} options.searchFilter.desc - Description filter for products.
 * @param {string} options.searchFilter.speciality - Speciality filter for products.
 * @returns {[Object[], Object]} - An array with the list of categories with products and an object containing loading, error, fetchMore, and totalCount properties.
 */
export const useCatWithProduct = ({
    max = 400,
    min = 0,
    search = null,
    productName = null,
    searchFilter= {}
} = {}) => {
  const [onClickLogout] = useLogout()
    
  const {
        gender,
        desc,
        speciality
    } = searchFilter || {}

  const {
    data,
    loading,
    error,
    fetchMore
} = useQuery(GET_ALL_CATEGORIES_WITH_PRODUCT, {
  onError: (error) => {
    const errors = {
      errors: error?.graphQLErrors || []
    }
    const responseError = errorHandler(errors);
    console.log(responseError)

    if (error.message === 'Token expired' || responseError) {
      onClickLogout()
    }
  
  },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    variables:
    {
      search,
      productName,
      gender: gender,
      min,
      max: max,
      desc: desc,
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