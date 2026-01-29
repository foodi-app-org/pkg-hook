import { gql } from '@apollo/client'

/**
 * GraphQL Mutation for creating a store table
 */
export const CREATE_TABLE_MUTATION = gql`
  mutation storeTableCreate($tableName: String!, $seats: Int, $section: String, $tableState: Int) {
    storeTableCreate(tableName: $tableName, seats: $seats, section: $section, tableState: $tableState) {
      success
      message
      errors {
        message
        path
        type
        context {
          limit
          value
          label
          key
        }
      }
      data {
        tableId
        tableName
        seats
        section
        tableState
        createdAt
        updatedAt
      }
    }
  }
`

export const STORE_TABLES_QUERY = gql`
  query {
    storeTables {
      tableId
      tableName
      seats
      section
      tableState
      createdAt
      updatedAt
    }
  }
`
