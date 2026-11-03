import { gql } from '@apollo/client'

export const CREATE_AVAILABLE_PRODUCTS_DAYS = gql`
mutation registerAvailableProduct($input: [IAvailableProduct]) {
    registerAvailableProduct(input: $input) {
    success
    message
    errors {
      message
      path
    }
    data {
      availableProductId
      idStore
      pId
      dayAvailable
      startDate
      endDate
    }
  }
}
`
