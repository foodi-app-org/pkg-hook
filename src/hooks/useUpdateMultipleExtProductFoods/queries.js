import { gql } from '@apollo/client'

// CREATE EXTRAS PRODUCT
export const UPDATE_MULTI_EXTRAS_PRODUCT_FOOD = gql`
  mutation updateMultipleExtProductFoods(
    $inputLineItems: ILineItemsExtraFinal
  ) {
    updateMultipleExtProductFoods(inputLineItems: $inputLineItems) {
      pId
      exPid
      exState
      extraName
      extraPrice
      state
      pDatCre
      pDatMod
    }
  }
`
