import { gql } from '@apollo/client'

export const CREATE_CATEGORY_PRODUCT = gql`
  mutation CreateCategoryProduct($input: InputCatProducts) {
    updatedProducts(input: $input) {
      success
      message
    }
  }
`
