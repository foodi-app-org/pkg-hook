import { gql } from '@apollo/client'

export const GET_EMPLOYEES = gql`
query employees {
  employees {
    data {
        eId
        idStore
        idRole
        eEmail
        eState
        status
    }
    success
    message
 pagination {
      totalRecords
      totalPages
      currentPage
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
