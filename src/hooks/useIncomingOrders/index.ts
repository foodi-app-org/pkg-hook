import { useQuery } from '@apollo/client'

import { GET_ALL_INCOMING_ORDERS } from './queries' // Asegúrate de importar tu consulta GraphQL

export const useIncomingOrders = ({ statusOrder, idStore }) => {
  const { data, loading, error } = useQuery(GET_ALL_INCOMING_ORDERS, {
    variables: (statusOrder && idStore) ? { statusOrder, idStore } : {}
  })

  return [data?.getAllIncomingToDayOrders || [], { loading, error }]
}
