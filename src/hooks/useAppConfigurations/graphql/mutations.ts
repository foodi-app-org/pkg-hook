import { gql } from '@apollo/client'

export const UPSERT_CONFIGURATION = gql`
  mutation UpsertConfiguration(
    $input: UpsertConfigurationInput!
  ) {
    upsertConfiguration(input: $input) {
      success
      message
      data {
        id
        scope
        componentName
        key
        value
        description
        version
        updatedAt
      }
    }
  }
`

export const UPSERT_CONFIGURATIONS = gql`
  mutation UpsertConfigurations(
    $inputs: [ConfigurationBulkItemInput!]!
  ) {
    upsertConfigurations(inputs: $inputs) {
      success
      message
      data {
        id
        scope
        componentName
        key
        value
        description
        version
        updatedAt
      }
    }
  }
`

export const RESET_CONFIGURATION = gql`
  mutation ResetConfiguration(
    $scope: ConfigurationScope!
    $componentName: String!
    $key: String!
  ) {
    resetConfiguration(
      scope: $scope
      componentName: $componentName
      key: $key
    ) {
      success
      message
    }
  }
`