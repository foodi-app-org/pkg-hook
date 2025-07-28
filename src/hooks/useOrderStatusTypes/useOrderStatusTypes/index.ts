import { useQuery, gql } from '@apollo/client'

/**
 * GraphQL query to fetch order status types.
 */
const GET_ORDER_STATUS_TYPES = gql`
  query getOrderStatusTypes {
    getOrderStatusTypes {
      idStatus
      name
      priority
      backgroundColor
      color
      state
    }
  }
`

/**
 * @typedef {Object} OrderStatusType
 * @property {string} idStatus - Unique identifier for the status
 * @property {string} name - Name of the status
 * @property {number} priority - Priority level
 * @property {string} backgroundColor - Background color in hex
 * @property {string} color - Text color in hex
 * @property {number} state - Status state (e.g. active/inactive)
 */

/**
 * Custom hook to fetch order status types.
 *
 * @returns {{
 *   statusTypes: OrderStatusType[] | null,
 *   loading: boolean,
 *   error: Error | undefined,
 *   refetch: () => void
 * }}
 */
export const useOrderStatusTypes = () => {
  const { data, loading, error, refetch } = useQuery(GET_ORDER_STATUS_TYPES, {
    fetchPolicy: 'cache-and-network'
  })

  const statusTypes = data?.getOrderStatusTypes ?? null

  return {
    statusTypes,
    loading,
    error,
    refetch
  }
}
