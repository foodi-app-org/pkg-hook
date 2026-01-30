import { useQuery } from '@apollo/client'
import groupBy from 'lodash/groupBy'
import { GET_ALL_ORDER, GET_ALL_ORDER_FROM_STORE } from '../queries'

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
}) => {
  const { data, loading, error, fetchMore } = useQuery(GET_ALL_ORDER, {
    notifyOnNetworkStatusChange: true,
    refetchWritePolicy,
    pollInterval,
    fetchPolicy,
    refetch,
    refetchReadPolicy,
    nextFetchPolicy,
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

export const useOrdersFromStore = ({
  idStore,
  cId,
  dId,
  ctId,
  search = '',
  min,
  fromDate,
  toDate,
  max,
  statusOrder,
  callback = (data) => {
    return data
  }
}) => {
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
    onCompleted: (data) => {
      if (typeof callback === 'function') {
        callback(data)
      }
    }
  })
  const grouped = groupBy(data?.getAllSalesStore ?? [], key)
 

  return [grouped, { refetch, loading: called ? false : loading, error }]
}

