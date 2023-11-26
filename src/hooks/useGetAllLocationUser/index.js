import { useQuery } from '@apollo/client'
import { GET_ALL_LOCATIONS } from './queries'

/**
 * useGetAllLocationUser
 * @returns {any}
 */
export const useGetAllLocationUser = () => {
  const { data, loading } = useQuery(GET_ALL_LOCATIONS)

  return [data, { loading }]
}
