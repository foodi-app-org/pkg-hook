import { gql, useMutation } from '@apollo/client'

/**
 * GraphQL Mutation for updating stock and manageStock
 */
const UPDATE_MANAGE_STOCK = gql`
  mutation UpdateManageStock($input: InputManageStock) {
    updateManageStock(input: $input) {
      success
      message
      data {
        pId
        manageStock
      }
    }
  }
`

/**
 * Custom hook to update stock and manageStock
 * @returns {object} { updateManageStock, data, loading, error }
 */
export const useUpdateManageStock = () => {
  const [updateManageStockMutation, { data, loading, error }] = useMutation(UPDATE_MANAGE_STOCK)

  /**
   * Function to call the mutation with given input
   * @param {Object} input - { pId, stock, manageStock }
   * @returns {Promise<Object>} Mutation response
   */
  const updateManageStock = async (input) => {
    try {
      const { data } = await updateManageStockMutation({ variables: { input } })
      return data?.updateManageStock
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  return [updateManageStock, { data, loading, error }]
}
