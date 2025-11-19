import { gql } from '@apollo/client'

export const GET_ALL_CAT_STORE = gql`
query getAllCatStore{
getAllCatStore{
  catStore
  idUser
  cPathImage
  cName
  cState
  createdAt
  updatedAt
  csDescription
  }
}
`
