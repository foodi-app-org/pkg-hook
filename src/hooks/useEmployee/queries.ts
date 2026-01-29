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
      user {
        id
        name
        username
        lastName
        email
        avatar
        uToken
        uPhoNum
        ULocation
        upLat
        uState
        upLon
        upIdeDoc
        siteWeb
        description
        createAt
        associateStore
      }
      roles {
        idRole
name
priority
description
permissions
createdAt
updatedAt
      }
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
/**
 * GraphQL mutation for creating an employee, store, and user.
 */
export const CREATE_ONE_EMPLOYEE_STORE_AND_USER = gql`
  mutation createOneEmployeeStoreAndUser($input: IEmployeeStore!) {
    createOneEmployeeStoreAndUser(input: $input) {
      success
      message
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
