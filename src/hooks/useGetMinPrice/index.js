import { useQuery } from '@apollo/client'
import { GET_MIN_PEDIDO } from './queries'

export const useGetMinPrice = () => {
  const { data, loading, error } = useQuery(GET_MIN_PEDIDO)

  return [data, { loading, error }]
}
