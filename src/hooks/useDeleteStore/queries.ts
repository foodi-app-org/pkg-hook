import { gql } from '@apollo/client'

/**
 * Permanently deletes a store/tenant: drops its PostgreSQL schema (all tables
 * and records) and removes the store and its associated user from the public
 * schema, so the commerce can be registered again from scratch.
 *
 * Destructive and irreversible. Requires an authenticated session. When
 * `idStore` is omitted the backend falls back to the store bound to the
 * current session (restaurant header).
 */
export const DELETE_STORE = gql`
  mutation DeleteStore($idStore: ID) {
    deleteStore(idStore: $idStore) {
      success
      message
      idStore
      storesDeleted
      usersDeleted
    }
  }
`
