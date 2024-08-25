import { useMutation } from '@apollo/client'
import { useState } from 'react'
import { CREATE_ONE_EMPLOYEE_STORE_AND_USER } from './queries'

/**
 * Custom hook to handle the createOneEmployeeStoreAndUser mutation.
 *
 * @returns {{
 *   createEmployeeStoreAndUser: (input: IEmployeeStore) => Promise<void>,
 *   loading: boolean,
 *   error: Error | null,
 *   data: Object | null
 * }} An object containing the mutation function, loading status, error, and data.
 */
export const useCreateEmployeeStoreAndUser = () => {
  const [createEmployeeStoreAndUserMutation, { loading, error, data }] = useMutation(CREATE_ONE_EMPLOYEE_STORE_AND_USER)
  const [errors, setErrors] = useState([])

  /**
   * Calls the createOneEmployeeStoreAndUser mutation.
   *
   * @param {Object} input - The input data for the mutation.
   * @returns {Promise<void>}
   */
  const createEmployeeStoreAndUser = async (input) => {
    try {
      const response = await createEmployeeStoreAndUserMutation({ variables: { input } })
      if (response.data.createOneEmployeeStoreAndUser.errors) {
        setErrors(response.data.createOneEmployeeStoreAndUser.errors)
      } else {
        setErrors([])
      }
    } catch (err) {
      setErrors([{ message: err.message }])
    }
  }

  return [createEmployeeStoreAndUser, {
    loading,
    error,
    data,
    errors
  }]
}
