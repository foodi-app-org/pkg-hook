import { gql } from '@apollo/client'

/**
 * Reads the availability schedule of a single product.
 * Backed by the modular resolver `getAllAvailableProduct(pId)`.
 */
export const GET_AVAILABLE_PRODUCT_DAYS = gql`
  query getAllAvailableProduct($pId: ID) {
    getAllAvailableProduct(pId: $pId) {
      availableProductId
      idStore
      pId
      dayAvailable
      startDate
      endDate
      state
      createdAt
      updatedAt
    }
  }
`
