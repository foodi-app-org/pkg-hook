import { useQuery } from '@apollo/client'
import { GET_ALL_CATEGORIES_WITH_PRODUCT_CLIENTS } from './queries'

/**
 * Custom hook to fetch categories with product data.
 *
 * @param {string} idStore - The ID of the store.
 * @returns {object} - The hook result containing data and fetch function.
 */
export const useCatWithProductClient = (idStore) => {
  const { data, loading, error, fetchMore } = useQuery(GET_ALL_CATEGORIES_WITH_PRODUCT_CLIENTS, {
    fetchPolicy: 'cache-and-network',
    variables: {
      max: 100,
      idStore,
      search: '',
      gender: [],
      desc: [],
      categories: []
    }
  })

  const fetchCategories = () => {
    fetchMore({
      variables: {
        max: 100,
        idStore,
        search: '',
        gender: [],
        desc: [],
        categories: []
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev
        return {
          ...prev,
          getCatProductsWithProductClient: fetchMoreResult.getCatProductsWithProductClient
        }
      }
    })
  }

  return [data?.getCatProductsWithProductClient || [], {
    loading,
    error,
    fetchCategories
  }]
}
