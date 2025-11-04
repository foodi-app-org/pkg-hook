import { useQuery, gql } from '@apollo/client'

/**
 * GraphQL query to fetch order status types.
 */
const GET_ORDER_STATUS_TYPES = gql`
  query getAllOrderStatusTypes {
    getAllOrderStatusTypes {
      message
      success
      __typename
      data {
        backgroundColor
        color
        createdAt
        description
        idStatus
        name
        priority
        state
        updatedAt
        __typename
      }
      errors {
         context {
          key
          label
          limit
          value
          __typename
         }
      }
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
  const {
    data,
    loading,
    error,
    refetch
  } = useQuery(GET_ORDER_STATUS_TYPES, {
    fetchPolicy: 'cache-and-network'
  })
  const statusTypes = data?.getAllOrderStatusTypes?.data ?? null

  return {
    data: statusTypes,
    loading,
    error,
    refetch
  }
}
