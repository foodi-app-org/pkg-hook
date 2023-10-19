import { useQuery } from '@apollo/client'
import { GET_ALL_ROAD } from './queries'

/**
 * Custom hook to fetch all roads.
 *
 * @returns {Object} - Returns an object containing road data and any associated query state/error.
 */
export function useRoads () {
  const { data, loading, error } = useQuery(GET_ALL_ROAD)

  // Here, you can handle any additional logic you might need, like mapping data, handling errors, etc.

  return {
    data: data || [],
    loading,
    error
  }
}
