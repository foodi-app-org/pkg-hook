import { gql } from '@apollo/client'

export const GET_ONE_RATING_STORE = gql`
query getOneRating($idStore: ID){
getOneRating(idStore: $idStore){
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
