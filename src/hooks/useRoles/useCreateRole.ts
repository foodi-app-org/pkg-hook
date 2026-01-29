import { useMutation } from '@apollo/client'
import { CREATE_ROLE_MUTATION } from './queries'
/**
 * Custom hook para crear un nuevo rol
 * @returns {Object} - Estado de la mutación, incluyendo loading, error, data y la función createRoleMutation
 */
export const useCreateRole = ({
  sendNotification = () => {
    return {
      title: '',
      description: '',
      backgroundColor: ''
    }
  }
} = {
  sendNotification: () => {
  }
}) => {
  const [createRoleMutation, { loading, error, data }] = useMutation(CREATE_ROLE_MUTATION, {
    onError: () => {
      sendNotification({
        title: 'Error',
        description: 'Ocurrió un error inesperado',
        backgroundColor: 'error'
      })
    },
    onCompleted: () => {
      return null
    }
  })

  return [createRoleMutation, {
    loading,
    error,
    data: data?.createRoleMutation ?? null
  }]
}
