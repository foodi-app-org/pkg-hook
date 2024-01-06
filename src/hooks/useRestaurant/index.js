import { useEffect, useState } from 'react'
import { useLazyQuery } from '@apollo/client'
import { GET_ALL_RESTAURANT } from './queries'
import { filterAndSortByDate } from './helpers'
import { useManageQueryParams } from '../useManageQueryParams'

export const useRestaurant = ({
  location = {
    pathname: ''
  }
} = {}) => {
  const [loadingFilter, setLoadingFilter] = useState(false)
  const { handleQuery, handleCleanQuery } = useManageQueryParams()

  const [getAllStoreInStore, {
    data,
    loading,
    error,
    fetchMore
  }] = useLazyQuery(GET_ALL_RESTAURANT, {
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    nextFetchPolicy: 'cache-first',
    refetchWritePolicy: 'merge',
    context: { clientName: 'admin-store' }
  })

  useEffect(() => {
    getAllStoreInStore({})
  }, [location])
  const handleSendQueries = (name, value) => {
    if (value) handleQuery(name, value)
  }

  const handleCleanQueries = (name) => {
    handleCleanQuery(name)
  }
  const handleFilterStore = async () => {
    setLoadingFilter(true)
    try {
      getAllStoreInStore({

      }).then(() => {
        setLoadingFilter(false)
      })
    } catch (error) {
      setLoadingFilter(false)
    }
  }
  const dataRestaurant = data?.getAllStoreInStore || []
  const dataSort = filterAndSortByDate(dataRestaurant)
  return [dataSort, {
    loading,
    loadingFilter,
    error,
    fetchMore,
    handleSendQueries,
    handleFilterStore,
    handleCleanQueries
  }]
}
