import { gql, useMutation } from '@apollo/client'

/**
 * GraphQL mutation to raise a MAIN product's stock as an inventory ENTRY.
 *
 * The backend registers ONLY the positive difference (target - current) as a
 * RESTOCK movement in the kardex and NEVER lowers existing stock — mirroring the
 * product-extra edit rule. Lowering stock must go through a sale or an inventory
 * adjustment, not this flow.
 */
const RESTOCK_PRODUCT = gql`
  mutation RestockProduct($input: InputRestockProduct) {
    restockProduct(input: $input) {
      success
      message
      data {
        pId
        manageStock
        stock
        previousStock
      }
    }
  }
`

export interface RestockProductInput {
  /** Main product id. */
  pId: string
  /** Target absolute stock. Only increases are applied. */
  stock: number
}

export interface RestockProductResult {
  success: boolean
  message: string
  data?: {
    pId: string
    manageStock: boolean
    stock: number
    previousStock: number
  } | null
}

/**
 * Hook to increase a main product's stock (inventory entry / RESTOCK).
 *
 * @returns A tuple with the `restockProduct` callback and the mutation state.
 */
export const useRestockProduct = () => {
  const [restockProductMutation, { data, loading, error }] = useMutation(RESTOCK_PRODUCT)

  /**
   * Raises the product stock to `input.stock`. Only the positive difference is
   * applied as a RESTOCK; the backend ignores attempts to lower the stock.
   *
   * @param input - `{ pId, stock }` with the target absolute stock.
   * @returns The mutation payload (`{ success, message, data }`).
   */
  const restockProduct = async (input: RestockProductInput): Promise<RestockProductResult> => {
    try {
      const { data } = await restockProductMutation({ variables: { input } })
      return data?.restockProduct as RestockProductResult
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'An unknown error occurred'
      }
    }
  }

  return [restockProduct, { data, loading, error }] as const
}
