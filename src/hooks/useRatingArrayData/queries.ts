import { gql } from '@apollo/client'

 
export const GET_All_RATING_STORE = gql`
query getAllRating($idStore: ID){
  getAllRating(idStore: $idStore){
  idStore
  rId
  id
  rAppearance
  rTasty
  rGoodTemperature
  rGoodCondition
  rState
  createAt
  updateAt
  }
}
`
