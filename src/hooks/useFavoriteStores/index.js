import { useQuery } from '@apollo/client'
import { GET_ALL_FAV_STORE } from './queries'

export const useFavoriteStores = () => {
  const {
    data,
    loading,
    error
  } = useQuery(GET_ALL_FAV_STORE, {
    fetchPolicy: 'cache-and-network',
    onError: () => {
      console.log('')
    }
  })

  const favoriteStores = data?.getFavorite || []

  return [favoriteStores, { loading, error }]
}
