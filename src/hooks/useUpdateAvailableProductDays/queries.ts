import { gql } from '@apollo/client'

/**
 * Synchronizes the whole weekly availability of a product.
 * The backend reconciles the given set (create new days, update existing
 * ranges and remove the rest). An empty `input` clears the schedule.
 */
export const UPDATE_AVAILABLE_PRODUCTS_DAYS = gql`
  mutation updateAvailableProduct($pId: ID, $input: [IAvailableProduct]) {
    updateAvailableProduct(pId: $pId, input: $input) {
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
        state
      }
    }
  }
`
