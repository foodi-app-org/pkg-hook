import { gql } from '@apollo/client'

export const GET_ONE_COUNTRY = gql`
query getOneCountry($cId: ID){
  getOneCountry(cId: $cId) {
    cId
    cName
    cName
    cDatCre
    cCalCod
    cState
    cDatMod

  }
}
`
export const GET_ONE_DEPARTMENT = gql`
query getOneDepartment($dId: ID){
    getOneDepartment(dId: $dId) {
    dId
    cId
    dName
    dState
    dDatCre
    dDatMod
  }
}
`
export const GET_ONE_CITY = gql`
query getOneCities($ctId: ID){
    getOneCities(ctId: $ctId) {
        ctId
        dId
        cName
        cState
        cDatCre
        cDatMod
  }
}
`
