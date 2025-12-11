import { gql } from '@apollo/client'

export const GET_ALL_LOCATIONS = gql`

query getUserLocations {
  getUserLocations {
    locationId
    # id
    cId
    dId
    ctId
    uLatitud
    uLongitude
    uLocationKnow
    uPiso
    DatCre
    DatMod
       pais {
        cId
        cName
        cCalCod
        cState
        cDatCre
        cDatMod
      }
      city {
        ctId
        dId
        cName
        cState
        cDatCre
        cDatMod
      } 
      department {
        dId
        cId
        dName
        dState
        dDatCre
        dDatMod
      }
  }
}
`
