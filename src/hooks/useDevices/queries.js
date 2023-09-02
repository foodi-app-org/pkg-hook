import { gql } from '@apollo/client'

export const GET_ALL_DEVICES = gql`
query getDeviceUsers{
  getDeviceUsers{
      dId
      locationFormat
      deviceId
      deviceName
      type
      short_name
      platform
      version
      dState
      DatCre
      DatMod
  }
}
`
