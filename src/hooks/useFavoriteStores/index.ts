import { useQuery } from '@apollo/client'
import { IStore } from 'typesdefs/dist/hooks/hooks/useStore/types'

import { filterAndSortByDate } from '../useRestaurant/helpers'
import { getStatusForStores } from '../useRestaurant/helpers/manageStatusOpen'

import { GET_ALL_FAV_STORE } from './queries'

export const useFavoriteStores = () => {
  const {
    data,
    loading,
    error
  } = useQuery(GET_ALL_FAV_STORE, {
    fetchPolicy: 'cache-and-network'
  })
  type StoreType = { getOneStore: IStore }

  const newArray = data?.getFavorite?.map((store: StoreType) => {
    return {
      ...store.getOneStore
    }
  }) || []
  const dataSort = filterAndSortByDate(newArray)

  const statuses = getStatusForStores(dataSort as any)

  const favoriteStores = statuses || []

  return [loading ? [] : favoriteStores, { loading, error }]
}
