import { gql } from '@apollo/client'

export const GET_ALL_ROLES = gql`
query getRoles($idStore: ID, $search: String, $min: Int, $max: Int, $fromDate: DateTime, $toDate: DateTime, $page: Int) {
  getRoles(idStore: $idStore, search: $search, min: $min, max: $max, fromDate: $fromDate, toDate: $toDate, page: $page) {
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
      __typename
    }
    pagination {
      totalRecords
      totalPages
      currentPage
      __typename
    }
    data { 
     idRole
      name
      priority
      description
      permissions
      createdAt
      updatedAt
    }
  }
}
`

/**
 * Mutación para crear un nuevo rol
 */
export const CREATE_ROLE_MUTATION = gql`
mutation createRoleMutation($input: IRole!) {
  createRoleMutation(input: $input) {
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
      __typename
    }
      data { 
     idRole
      name
      priority
      description
      permissions
      createdAt
      updatedAt
    }
  }
}
`