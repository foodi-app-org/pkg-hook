import { gql, useMutation } from '@apollo/client'

const CREATE_ORDER_STATUS_TYPE = gql`
  mutation CreateOrderStatusType($data: OrderStatusTypeInput!) {
    createOrderStatusType(data: $data) {
      success
      message
      data {
        idStatus
        name
        description
        color
        priority
        createdAt
        updatedAt
      }
      errors {
        message
        path
        type
        __typename
      }
    }
  }
`

interface OrderStatusTypeInput {
  name: string
  description?: string
  color?: string
  priority?: number
  state?: number
}

interface OrderStatusType {
  idStatus: string
  name: string
  description: string
  color: string
  priority: number
  createdAt: string
  updatedAt: string
}

interface ResponseOrderStatusType {
  success: boolean
  message: string
  data?: OrderStatusType
  errors?: Array<{
    message: string
    path?: string
    type?: string
    __typename?: string
  }>
}

/**
 * 🧩 Hook personalizado para crear un OrderStatusType
 */
export const useCreateOrderStatusType = ({
  sendNotification
}: {
  sendNotification: (options: {
    title: string
    description: string
    backgroundColor: 'success' | 'error' | 'info' | 'warning'
  }) => void
}) => {
  const [createOrderStatusType, { data, loading, error }] =useMutation<{ createOrderStatusType: ResponseOrderStatusType }>(CREATE_ORDER_STATUS_TYPE, {
    onCompleted: (data) => {
      const createOrderStatusType = data.createOrderStatusType
      const { success, message } = createOrderStatusType ?? {
        success: false,
        message: 'Error desconocido'
      }
      sendNotification({
        title: success ? 'Estado de orden creado' : 'Error al crear el estado de orden',
        description: message,
        backgroundColor: success ? 'success' : 'error',
      })
    }
  })

  const handleCreateStatus = async (input: OrderStatusTypeInput) => {
    try {
      const response = await createOrderStatusType({
        variables: { data: input },
      })
      return response.data?.createOrderStatusType
    } catch (err) {
      sendNotification({
        title: 'Error al crear el estado de orden',
        description: 'Ha ocurrido un error inesperado al crear el estado de orden.',
        backgroundColor: 'error',
      })
      throw err
    }
  }

  return [handleCreateStatus, {
    data: data?.createOrderStatusType,
    loading,
    error,
  }]
}
