import { useLazyQuery } from '@apollo/client'
import { useEffect, useState } from 'react'

import { useManageQueryParams } from '../useManageQueryParams'

import { filterAndSortByDate } from './helpers'
import { getStatusForStores } from './helpers/manageStatusOpen'
import { GET_ALL_RESTAURANT } from './queries'

export type ItemWithCreatedAt = {
  createdAt: string;
  [key: string]: any;
};

type CustomLocation = {
  query: Record<string, any>;
  push: (url: string) => void;
};

export const useRestaurant = ({
  location = {
    query: {},
    push: (url: string) => { 
      return url
    }
  }
}: { location?: CustomLocation } = {}) => {
  const [loadingFilter, setLoadingFilter] = useState(false)
  const { handleQuery, handleCleanQuery } = useManageQueryParams({
    location
  })

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

  const handleSendQueries = (name: string, value: any) => {
    if (value) handleQuery(name, value)
  }

  const handleCleanQueries = (name: string) => {
    handleCleanQuery(name)
  }
  const handleFilterStore = async () => {
    setLoadingFilter(true)
    try {
      await getAllStoreInStore({

      }).then(() => {
        setLoadingFilter(false)
      })
    } catch (error) {
      if (error instanceof Error) {
        setLoadingFilter(false)
      }
      setLoadingFilter(false)
    }
  }


  const dataRestaurant: ItemWithCreatedAt[] = data?.getAllStoreInStore || [];
  const dataSort: any[] = filterAndSortByDate(dataRestaurant);
  const statuses = getStatusForStores(dataSort as any) || [];

  return [statuses, {
    loading,
    loadingFilter,
    error,
    fetchMore,
    handleSendQueries,
    handleFilterStore,
    handleCleanQueries
  }]
}
