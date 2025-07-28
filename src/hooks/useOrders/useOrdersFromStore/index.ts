import { useQuery } from '@apollo/client'
import { GET_ALL_ORDER, GET_ALL_PEDIDOS_FROM_STORE } from '../queries.js'

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
  callback = () => {

  }
}) => {
  const {
    data,
    loading,
    error,
    called
  } = useQuery(GET_ALL_PEDIDOS_FROM_STORE, {
    onCompleted: (data) => {
      if (typeof callback === 'function') {
        callback(data)
      }
    },
    variables: {
      idStore,
      cId,
      dId,
      ctId,
      search,
      min,
      fromDate,
      toDate,
      max,
      statusOrder
    }
  })

  return [data?.getAllOrdersFromStore || [], { loading: called ? false : loading, error }]
}

