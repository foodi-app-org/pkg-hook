import { useMutation, gql } from '@apollo/client'

// Define the GraphQL mutation
const REMOVE_ROLES_MUTATION = gql`
  mutation removeRoles($roleIds: [ID!]!) {
    removeRoles(roleIds: $roleIds) {
      success
      message
    }
  }
`

/**
 * Custom hook to call removeRoles mutation.
 *
 * @returns {Object} An object containing the mutation function and the loading/error state.
 */
export function useRemoveRoles () {
  const [removeRoles, { loading, error, data }] = useMutation(REMOVE_ROLES_MUTATION, {
    onError: (err) => {
      console.error('Error removing roles:', err)
    }
  })

  const removeRolesHandler = async ({ roleIds = [] }) => {
    try {
      const { data } = await removeRoles({ variables: { roleIds } })
      return data.removeRoles
    } catch (err) {
      console.error('Error removing roles:', err)
      throw err
    }
  }

  return [removeRolesHandler, {
    loading,
    error,
    data
  }]
}
