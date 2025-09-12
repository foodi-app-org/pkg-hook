import { gql } from '@apollo/client'

// CREATE EXTRAS PRODUCT
export const UPDATE_MULTI_EXTRAS_PRODUCT_FOOD = gql`
mutation updateMultipleExtProduct($inputLineItems: ILineItemsExtraFinal) {
  updateMultipleExtProduct(inputLineItems: $inputLineItems) {
    success
    message
    data {
      pId
      exPid
      exState
      extraName
      extraPrice
      state
      createdAt
      updatedAt
    }
    errors {
      path
      message
      type
      context {
        limit
        value
        label
        key
        __typename
      }
    }
  }
}
`
