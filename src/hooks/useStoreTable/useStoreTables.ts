import { useQuery } from '@apollo/client'
import { STORE_TABLES_QUERY } from './queries' // Ajusta la ruta a tu archivo de queries

/**
 * Custom hook to fetch store tables data
 * @param {Object} args - Arguments for fetching store tables, e.g., info field.
 * @param {Object} ctx - Context that provides restaurant-related information.
 * @returns {Object} - Object containing tables data, loading state, and error.
 */
export const useStoreTables = () => {
  const { data, loading, error } = useQuery(STORE_TABLES_QUERY)

  return [data, { loading, error }]
}
