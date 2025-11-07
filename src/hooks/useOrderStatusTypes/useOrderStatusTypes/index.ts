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
      pagination {
        currentPage
        totalPages
        totalRecords
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
/**
 * Retrieves order status types via the corresponding GraphQL query and exposes loading state, errors, and refetch capabilities.
 *
 * @param options - Optional configuration values for the hook.
 * @param options.callback - Callback invoked when the query completes successfully, receiving the raw query response.
 * @returns An object containing the normalized status types data along with loading, error, and refetch helpers.
 */
export interface OrderStatusType {
  idStatus: string
  name: string
  priority: number
  backgroundColor: string
  color: string
  state: number
  description: string
  createdAt: string
  updatedAt: string
  __typename: string
}

export interface OrderStatusTypeErrorContext {
  key: string
  label: string
  limit: number
  value: string
  __typename: string
}

export interface OrderStatusTypeError {
  context: OrderStatusTypeErrorContext[]
  __typename: string
}

export interface GetAllOrderStatusTypesResponse {
  message: string
  success: boolean
  __typename: string
  data: OrderStatusType[]
  errors?: OrderStatusTypeError[] | null
}

export interface OrderStatusTypesQueryResult {
  getAllOrderStatusTypes: GetAllOrderStatusTypesResponse
}

export interface UseOrderStatusTypesOptions {
  callback?: (payload: OrderStatusTypesQueryResult) => void
}

export const useOrderStatusTypes = ({
  callback = () => undefined
}: UseOrderStatusTypesOptions = {}) => {
  const {
    data,
    loading,
    error,
    refetch
  } = useQuery<OrderStatusTypesQueryResult>(GET_ORDER_STATUS_TYPES, {
    onCompleted: callback,
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
