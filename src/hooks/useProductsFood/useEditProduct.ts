import { useMutation } from '@apollo/client'
import { EDIT_PRODUCT } from './queriesStore'

export const useEditProduct = ({
  sendNotification = () => {
    return null
  }
} = {}) => {
  const [editProductFoods, { loading, error }] = useMutation(EDIT_PRODUCT, {
    onCompleted: (data) => {
      const { editProductFoods } = data
      const {
        success,
        message,
        errors
      } = editProductFoods || {
        success: false,
        message: '',
        errors: []
      }
      if (errors && errors.length > 0) {
        for (const error of errors) {
          sendNotification({
            title: 'Error',
            description: `${error.message}`,
            backgroundColor: 'error'
          })
        }
      }
      if (success) {
        sendNotification({
          title: 'Error',
          description: `${message}`,
          backgroundColor: 'error'
        })
      }
    },
    onError: (error) => {
      sendNotification({
        title: 'Error',
        description: error.message,
        backgroundColor: 'error'
      })
    }
  })

  return [editProductFoods, { loading, error }]
}
