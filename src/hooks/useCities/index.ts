import { useLazyQuery } from '@apollo/client'

import { GET_ALL_CITIES } from './queries'

/**
 * Custom hook to fetch cities lazily based on the provided department ID.
 *
 * @returns {Array} - Returns an array containing a function to execute the query, and an object containing data and any associated query state/error.
 */
export function useCities () {
  const [getCities, { data, loading, error }] = useLazyQuery(GET_ALL_CITIES)

  return [getCities, { data: data ? data?.getAllCities : [], loading, error }]
}
