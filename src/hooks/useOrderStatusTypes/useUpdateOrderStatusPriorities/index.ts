import { gql, useMutation } from '@apollo/client'
import { SendNotificationFn } from 'typesdefs'

interface OrderStatusPriorityInput {
  idStatus: string
  priority: number
}
/**
 * GraphQL mutation to update the priority of order statuses.
 */
const UPDATE_ORDER_STATUS_PRIORITIES = gql`
  mutation UpdateOrderStatusPriorities($data: [OrderStatusPriorityInput!]!) {
    updateOrderStatusPriorities(data: $data) {
      success
      message
      errors {
        path
        message
      }
      data {
        idStatus
        name
        priority
      }
    }
  }
`

interface UpdateStatusPriorityResponse {
  success: boolean
  message: string
  data: Array<{
    idStatus: string
    name: string
    priority: number
  }>
  errors: Array<{ path: string; message: string }>
}

interface UseUpdateOrderStatusPrioritiesOptions {
  sendNotification?:  SendNotificationFn
}
/**
 * Custom hook to update the priority of order statuses.
 *
 * @param root0
 * @param root0.sendNotification
 * @returns {{
 *   updatePriorities: (input: OrderStatusPriorityInput[]) => Promise<UpdateStatusPriorityResponse>,
 *   loading: boolean,
 *   error: any
 * }}
 */
export const useUpdateOrderStatusPriorities = ({
  sendNotification
}: UseUpdateOrderStatusPrioritiesOptions = {}) => {
  const [mutate, { loading, error }] = useMutation(UPDATE_ORDER_STATUS_PRIORITIES)

  /**
   * Executes the mutation to update order status priorities.
   *
   * @param {OrderStatusPriorityInput[]} input - Array of objects containing idStatus and priority.
   * @returns {Promise<UpdateStatusPriorityResponse>} Response from the server.
   */
  const updatePriorities = async (input: OrderStatusPriorityInput[]): Promise<UpdateStatusPriorityResponse> => {
    if (!Array.isArray(input) || input.length === 0) {
      return {
        success: false,
        message: 'Input must be a non-empty array.',
        data: [],
        errors: [{ path: 'input', message: 'Invalid or empty input array.' }]
      }
    }

    const isValid = input.every(
      ({ idStatus, priority }) =>
      {return typeof idStatus === 'string' &&
        idStatus.length > 0 &&
        typeof priority === 'number' &&
        priority >= 0}
    )

    if (!isValid) {
      return {
        success: false,
        message: 'Validation failed for one or more input items.',
        data: [],
        errors: [{ path: 'input', message: 'Each item must have a valid idStatus and priority.' }]
      }
    }

    try {
      const { data } = await mutate({ variables: { data: input } })
      if (data && data.updateOrderStatusPriorities) {
        const { updateOrderStatusPriorities } = data
        const { success, message } = updateOrderStatusPriorities
        if (typeof sendNotification === 'function') {
          sendNotification({
            title: success ? 'Exitoso' : 'Error',
            description: message,
            backgroundColor: success ? 'success' : 'error'
          })
        }
        return updateOrderStatusPriorities
      }
      return {
        success: false,
        message: 'No data returned from server.',
        data: [],
        errors: [{ path: 'mutation', message: 'No data returned from server.' }]
      }
    } catch (err) {
      if (err instanceof Error) {
        return {
          success: false,
          message: 'Error while updating priorities.',
          data: [],
          errors: [{ path: 'mutation', message: err.message }]
        }
      }
      return {
        success: false,
        message: 'Unknown error occurred.',
        data: [],
        errors: [{ path: 'mutation', message: 'Unknown error occurred.' }]
      }
    }
  }

  return [updatePriorities, { loading, error }]
}
