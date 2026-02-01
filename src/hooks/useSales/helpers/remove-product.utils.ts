/**
 *
 * @param state
 * @param action
 * @param productsFood
 * @returns updated state
 */
export function handleRemoveProduct(state: any, action: any, productsFood: any) {
  const productExist = state?.PRODUCT.find((items: any) => {
    return items.pId === action.payload.pId
  })
  const OurProduct = productsFood.find((items: any) => {
    return items.pId === action.payload.pId
  })
  return {
    ...state,
    counter: state.counter - 1,
    totalAmount: state.totalAmount - action.payload.ProPrice,
    PRODUCT:
      action.payload.ProQuantity > 1
        ? state.PRODUCT.map((items: any) => {
          return items.pId === action.payload.pId
            ? {
              ...items,
              pId: action.payload.pId,
              ProQuantity: items.ProQuantity - 1,
              ProPrice: productExist.ProPrice - OurProduct?.ProPrice
            }
            : items
        })
        : state.PRODUCT.filter((items: any) => {
          return items.pId !== action.payload.pId
        })
  }
}