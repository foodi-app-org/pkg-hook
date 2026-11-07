import { gql } from '@apollo/client'

/**
 * Mutation to update the category (`carProId`) of a single product.
 * Mirrors the backend `updateProductCategory(pId, carProId)` resolver which
 * validates that the category exists before updating the product's FK.
 */
export const UPDATE_PRODUCT_CATEGORY = gql`
  mutation updateProductCategory($pId: ID!, $carProId: ID!) {
    updateProductCategory(pId: $pId, carProId: $carProId) {
      success
      message
      data {
        pId
        carProId
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
        }
      }
    }
  }
`
