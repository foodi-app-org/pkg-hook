import { gql } from '@apollo/client'

export const GET_CONFIGURATION = gql`
  query GetConfiguration(
    $scope: ConfigurationScope!
    $componentName: String!
    $key: String!
  ) {
    getConfiguration(
      scope: $scope
      componentName: $componentName
      key: $key
    ) {
      id
      scope
      componentName
      key
      value
      description
      version
      createdAt
      updatedAt
    }
  }
`

export const GET_CONFIGURATIONS = gql`
  query GetConfigurations(
    $scope: ConfigurationScope!
    $componentName: String
    $search: String
    $limit: Int
    $offset: Int
  ) {
    getConfigurations(
      scope: $scope
      componentName: $componentName
      search: $search
      limit: $limit
      offset: $offset
    ) {
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
`

export const GET_RESOLVED_CONFIGURATION = gql`
  query GetResolvedConfiguration(
    $componentName: String!
    $key: String!
  ) {
    getResolvedConfiguration(
      componentName: $componentName
      key: $key
    ) {
      componentName
      key
      value
      sourceScope
      version
      updatedAt
    }
  }
`

export const GET_CONFIGURATION_EVENTS = gql`
  query GetConfigurationEvents(
    $scope: ConfigurationScope!
    $componentName: String
    $key: String
    $limit: Int
    $offset: Int
  ) {
    getConfigurationEvents(
      scope: $scope
      componentName: $componentName
      key: $key
      limit: $limit
      offset: $offset
    ) {
      id
      configurationId
      scope
      componentName
      key
      eventType
      source
      previousValue
      newValue
      actorId
      correlationId
      createdAt
    }
  }
`