import { gql } from '@apollo/client'

export const DELETE_STORE = gql`
  mutation deleteStore($idStore: ID) {
    deleteStore(idStore: $idStore) {
      success
      message
      idStore
      storesDeleted
      usersDeleted
    }
  }
`
