import { useQuery } from '@apollo/client'

import { filterAndSortByDate } from '../useRestaurant/helpers'
import { getStatusForStores } from '../useRestaurant/helpers/manageStatusOpen'

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
  const newArray = data?.getFavorite?.map(store => {
    return {
      ...store.getOneStore
    }
  }) || []
  const dataSort = filterAndSortByDate(newArray)

  const statuses = getStatusForStores(dataSort)

  const favoriteStores = statuses || []

  return [loading ? [] : favoriteStores, { loading, error }]
}
