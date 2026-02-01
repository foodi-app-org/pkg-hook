import { useMutation } from '@apollo/client'
import { useState } from 'react'

import { SendNotificationFn } from '../useImageUploaderProduct';

import { CREATE_ONE_EMPLOYEE_STORE_AND_USER } from './queries'

/**
 * Custom hook to handle the createOneEmployeeStoreAndUser mutation.
 *
 * @returns An object containing the mutation function, loading status, error, and data.
 */
type CallbackFn = (response?: any) => void;
type IEmployeeStore = Record<string, any>; // Replace with actual type if available

export const useCreateEmployeeStoreAndUser = ({
  sendNotification,
  onCompleted,
  onError
}: {
  sendNotification?: SendNotificationFn;
  onCompleted?: CallbackFn;
  onError?: CallbackFn;
} = {}) => {
  const [createEmployeeStoreAndUserMutation, { loading, error, data }] = useMutation(CREATE_ONE_EMPLOYEE_STORE_AND_USER, {
    onError: () => {
      sendNotification?.({
        description: 'Error creando empleado',
        title: 'Error',
        backgroundColor: 'error'
      })
    },
    onCompleted: (response) => {
      // console.log(response)
      const { createOneEmployeeStoreAndUser } = response ?? {}
      const { message, success } = createOneEmployeeStoreAndUser ?? {}
      if (success === false) {
        onError?.(response)
      }
      if (success) {
        onCompleted?.(response)
      }
      sendNotification?.({
        description: message,
        title: success ? 'Éxito' : 'Error',
        backgroundColor: success ? 'success' : 'error'
      })
    }
  })
  const [errors, setErrors] = useState<{ message: string }[]>([])

  /**
   * Calls the createOneEmployeeStoreAndUser mutation.
   *
   * @param input - The input data for the mutation.
   * @returns Promise<void>
   */
  const createEmployeeStoreAndUser = async (input: IEmployeeStore): Promise<void> => {
    try {
      const response = await createEmployeeStoreAndUserMutation({ variables: { input } })
      if (response.data.createOneEmployeeStoreAndUser.errors) {
        setErrors(response.data.createOneEmployeeStoreAndUser.errors)
      } else {
        setErrors([])
      }
    } catch (err) {
      let message = 'Unknown error'
      if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
        message = (err as any).message
      }
      setErrors([{ message }])
    }
  }

  return [createEmployeeStoreAndUser, {
    loading,
    error,
    data,
    errors
  }] as const
}
