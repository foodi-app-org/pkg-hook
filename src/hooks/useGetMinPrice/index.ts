import { useQuery } from '@apollo/client'

import { GET_MIN_PEDIDO } from './queries'

export const useGetMinPrice = ({ idStore = '' } = {}) => {
  const { data, loading, error } = useQuery(GET_MIN_PEDIDO, {
    variables: {
      idStore
    }
  })

  return [data, { loading, error }]
}
