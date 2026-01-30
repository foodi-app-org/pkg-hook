import { useLazyQuery } from '@apollo/client'

import { GET_ALL_DEPARTMENTS } from './queries'

/**
 * Custom hook to fetch departments lazily based on the provided company ID.
 *
 * @returns {Array} - Returns an array containing a function to execute the query, and an object containing data and any associated query state/error.
 */
export function useDepartments () {
  const [getDepartments, { data, loading, error }] = useLazyQuery(GET_ALL_DEPARTMENTS)

  return [getDepartments, { data: data ? data?.departments : [], loading, error }]
}
