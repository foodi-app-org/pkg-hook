import { gql } from '@apollo/client'

export const GET_ALL_ROAD = gql`
query getTypeRoad {
  road{
    rId
    rName
    rState
    rDatCre
    rDatMod
  }
}
`
