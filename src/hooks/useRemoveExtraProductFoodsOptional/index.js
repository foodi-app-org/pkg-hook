import { useMutation } from '@apollo/client'
import { DELETE_CAT_EXTRA_PRODUCTS } from './queries'

export const useRemoveExtraProductFoodsOptional = ({
  sendNotification = () => {
  }
} = {}) => {
  const [DeleteExtProductFoodsOptional, { loading, error }] = useMutation(DELETE_CAT_EXTRA_PRODUCTS, {
    onCompleted: data => {
      const { DeleteExtProductFoodsOptional: result } = data || {}
      const { success, message } = result || {}
      sendNotification({
        description: message,
        title: success ? 'Exito' : 'Error',
        backgroundColor: success ? 'success' : 'error'
      })
    }
  })

  const handleDeleteOptional = async elem => {
    const { state, opExPid } = elem || {}
    DeleteExtProductFoodsOptional({
      variables: {
        state,
        opExPid,
        isCustomOpExPid: true
      }
    })
  }
  return {
    handleDeleteOptional,
    DeleteExtProductFoodsOptional,
    loading,
    error
  }
}
