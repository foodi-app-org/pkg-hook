import { gql } from '@apollo/client'

/**
 * Query to fetch all device users with extended fields
 */
export const GET_ALL_DEVICES = gql`
  query getDeviceUsers {
    getDeviceUsers {
      dId
      id
      deviceId
      deviceName
      locationFormat
      type
      shortName
      platform
      version
      family
      os
      model
      ip
      isBot
      dState
      createdAt
      updatedAt
    }
  }
`
