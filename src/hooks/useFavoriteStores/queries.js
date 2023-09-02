import { gql } from '@apollo/client'

export const GET_ALL_FAV_STORE = gql`
query getFavorite{
  getFavorite{
    fIStoreId
    fState
    createAt
    updateAt
    idStore
    
    getOneStore {
      idStore
      cId
      id
      Image
      open
      cateStore{
      catStore
      cName
      
    }
      ctId
      catStore
      dId
      storeName
      Image
      city{
        ctId
        dId
        cName
      }
      department {
        dId
        cId
        dName
        
      }
      pais {
        cId
        cName
        
      }
    }
  }
}
`
