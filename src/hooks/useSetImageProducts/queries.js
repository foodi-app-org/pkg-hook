import { gql } from '@apollo/client'

export const UPDATE_IMAGE_PRODUCT_FOOD = gql`
  mutation setImageProducts($input: IFileImageProductFood) {
    setImageProducts(input: $input) {
      success
      message
      data {
        pId
        ProImage
        __typename
      }
      errors {
        message
      }
    }
  }
`
