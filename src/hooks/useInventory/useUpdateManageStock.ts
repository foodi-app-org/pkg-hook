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
   * @param input.pId
   * @param input.stock
   * @param input.manageStock
   * @returns {Promise<Object>} Mutation response
   */
  const updateManageStock = async (input: { pId: string; stock: number; manageStock: boolean }) => {
    try {
      const { data } = await updateManageStockMutation({ variables: { input } })
      return data?.updateManageStock
    } catch (err) {
      if (err instanceof Error) {
        return { success: false, message: err.message }
      }
      return { success: false, message: 'An unknown error occurred' }
    }
  }

  return [updateManageStock, { data, loading, error }]
}
