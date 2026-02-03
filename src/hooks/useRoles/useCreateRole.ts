import { useMutation } from '@apollo/client'

import { CREATE_ROLE_MUTATION } from './queries'
import {
  UseCreateRoleParams,
  UseCreateRoleReturn,
  CreateRoleResponse,
  CreateRoleVars
} from './useCreateRole.types'

export const useCreateRole = (
  {
    sendNotification = () => {}
  }: UseCreateRoleParams = {}
): UseCreateRoleReturn => {
  const [createRoleMutation, { loading, error, data }] = useMutation<
    CreateRoleResponse,
    CreateRoleVars
  >(CREATE_ROLE_MUTATION, {
    onError: () => {
      sendNotification({
        title: 'Error',
        description: 'Ocurrió un error inesperado',
        backgroundColor: 'error'
      })
    },
    onCompleted: () => null
  })

  return [
    createRoleMutation,
    {
      loading,
      error,
      data: data?.createRoleMutation ?? null
    }
  ]
}
