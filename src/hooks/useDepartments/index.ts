import { useLazyQuery } from '@apollo/client'

import { GET_ALL_DEPARTMENTS } from './queries'

/**
 * Custom hook to fetch departments lazily based on the provided company ID.
 * Returns a tuple containing the function to trigger the query and an object with the query's data, loading state, and any errors.
 * @param cId - The company ID for which to fetch the departments.
 * @example   const [getDepartments, { data, loading, error }] = useDepartments()
 * getDepartments({ variables: { cId: 'company-id' } })
 * @returns A tuple with the query function and an object containing the query's data, loading state, and error information.
 */
export function useDepartments (): [any, { data: any[]; loading: boolean; error: any }] {
  const [getDepartments, { data, loading, error }] = useLazyQuery(GET_ALL_DEPARTMENTS)
  return [getDepartments, { data: data ? data?.getAllDepartments : [], loading, error }]
}
