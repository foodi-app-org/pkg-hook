/**
 * Adds or removes a comment from a product in cart.
 * - Pure function (reducer-safe)
 * - Supports delete mode
 * - Avoids unnecessary re-renders
 *
 * @param {Object} params
 * @param {Object} params.state - Current reducer state
 * @param {string | number} params.productId - Product identifier
 * @param {string} params.comment - Comment text
 * @param {boolean} params.deleteValue - If true, removes the comment
 *
 * @returns {Object} Updated state
 */
export const commentProduct = ({
  state,
  productId,
  comment = '',
  deleteValue = false
}: {
  state: any;
  productId: string | number;
  comment?: string;
  deleteValue?: boolean;
}) => {
  if (!productId) return state

  const PRODUCT = state.PRODUCT.map((item: any) =>
  {return item.pId === productId
    ? {
      ...item,
      comment: deleteValue ? '' : comment
    }
    : item}
  )

  return {
    ...state,
    PRODUCT
  }
}
