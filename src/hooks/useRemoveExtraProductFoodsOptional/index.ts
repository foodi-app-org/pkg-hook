import { useMutation } from '@apollo/client'

import { DELETE_CAT_EXTRA_PRODUCTS } from './queries'

interface SendNotificationProps {
  description: string
  title: string
  backgroundColor: 'success' | 'error'
}

interface UseRemoveExtraProductFoodsOptionalProps {
  sendNotification?: (
    notification: SendNotificationProps
  ) => void
}

interface DeleteOptionalInput {
  state: number | string
  opExPid: string
}

export const useRemoveExtraProductFoodsOptional = ({
  sendNotification
}: UseRemoveExtraProductFoodsOptionalProps = {}) => {
  const [
    DeleteExtProductFoodsOptional,
    { loading, error }
  ] = useMutation(DELETE_CAT_EXTRA_PRODUCTS, {
    onCompleted: (data) => {
      const response = data?.DeleteExtProductFoodsOptional

      if (!response?.success) {
        sendNotification?.({
          description:
            response?.message ||
            'No fue posible actualizar la categoría de productos',
          title: 'Error',
          backgroundColor: 'error'
        })

        return
      }

      sendNotification?.({
        description: response.message,
        title: 'Categoría de productos',
        backgroundColor: 'success'
      })
    }
  })

  const handleDeleteOptional = async (
    elem: DeleteOptionalInput
  ) => {
    const { state, opExPid } = elem || {}

    try {
      return await DeleteExtProductFoodsOptional({
        variables: {
          state,
          opExPid,
          isCustomOpExPid: true
        }
      })
    } catch (err) {
      sendNotification?.({
        description:
          err instanceof Error
            ? err.message
            : 'Ha ocurrido un error inesperado',
        title: 'Error',
        backgroundColor: 'error'
      })

      throw err
    }
  }

  return {
    handleDeleteOptional,
    DeleteExtProductFoodsOptional,
    loading,
    error
  }
}