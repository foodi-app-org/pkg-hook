import { useMutation, gql } from '@apollo/client'

// Define the mutation
const UPDATE_ROLES_PRIORITY = gql`
  mutation updateRolesPriority($roles: [IParamsPriority]!) {
    updateRolesPriority(roles: $roles) {
      success
      message
    }
  }
`

/**
 * Custom hook to update roles priority
 * @returns {Object} - Returns the mutation function and the mutation state
 */
export const useUpdateRolesPriority = () => {
  const [updateRolesPriority, { data, loading, error }] = useMutation(UPDATE_ROLES_PRIORITY)

  /**
   * Function to update the priority of roles
   * @param {Array} roles - The array of roles with their priorities to be updated
   * @returns {Promise<void>}
   */
  const handleUpdateRolesPriority = async (roles) => {
    try {
      const response = await updateRolesPriority({
        variables: { roles }
      })

      // You can handle the response or any additional logic here
      return response
    } catch (err) {
      // Handle the error as needed
      console.error('Error updating roles priority:', err)
    }
  }

  return [handleUpdateRolesPriority, {
    data,
    loading,
    error
  }]
}
