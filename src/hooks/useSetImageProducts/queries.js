import { gql } from '@apollo/client'

export const UPDATE_IMAGE_PRODUCT_FOOD = gql`
  mutation setImageProducts($input: IFileImageProductFood) {
    setImageProducts(input: $input) {
      success
      message
      errors {
        message
      }
    }
  }
`
