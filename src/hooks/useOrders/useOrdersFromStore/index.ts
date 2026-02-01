import { useQuery, RefetchWritePolicy, WatchQueryFetchPolicy } from '@apollo/client'
import groupBy from 'lodash/groupBy'

import { GET_ALL_ORDER, GET_ALL_ORDER_FROM_STORE } from '../queries'

type UseOrdersProps = {
  refetchWritePolicy?: RefetchWritePolicy
  refetchReadPolicy?: RefetchWritePolicy
  refetch?: () => void
  statusOrder?: string
  fromDate?: string
  toDate?: string
  nextFetchPolicy?: WatchQueryFetchPolicy
  fetchPolicy?: WatchQueryFetchPolicy
  pollInterval?: number
  onError?: (error: any) => void
}

export const useOrders = ({
  refetchWritePolicy = 'merge',
  refetchReadPolicy,
  refetch,
  statusOrder,
  fromDate,
  toDate,
  nextFetchPolicy = 'cache-first',
  fetchPolicy = 'cache-and-network',
  pollInterval = 60000,
  onError
}: UseOrdersProps) => {
  const { data, loading, error, fetchMore } = useQuery(GET_ALL_ORDER, {
    notifyOnNetworkStatusChange: true,
    refetchWritePolicy: refetchWritePolicy as RefetchWritePolicy,
    pollInterval,
    fetchPolicy: fetchPolicy as WatchQueryFetchPolicy,
    refetch,
    refetchReadPolicy: refetchReadPolicy as RefetchWritePolicy | undefined,
    nextFetchPolicy: nextFetchPolicy as WatchQueryFetchPolicy,
    onError: onError || (() => {

    }),
    variables: {
      statusOrder,
      fromDate,
      toDate
    }
  })

  return [
    data?.getAllOrderStoreFinal,
    { loading, error, data, fetchMore }
  ]
}

type UseOrdersFromStoreProps = {
  callback?: (data: any) => any
}

export const useOrdersFromStore = ({
  callback = (data: any) => {
    return data
  }
}: UseOrdersFromStoreProps) => {
  const key = 'status'
  const {
    data,
    loading,
    refetch,
    error,
    called
  } = useQuery(GET_ALL_ORDER_FROM_STORE, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    onCompleted: (data: any) => {
      if (typeof callback === 'function') {
        callback(data)
      }
    }
  })
  const grouped = groupBy(data?.getAllSalesStore ?? [], key)
 

  return [grouped, { refetch, loading: called ? false : loading, error }]
}

