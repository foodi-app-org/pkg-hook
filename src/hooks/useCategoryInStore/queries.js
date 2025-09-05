import { gql } from '@apollo/client'

export const GET_ONE_STORE_IN_CATEGORY = gql`
query getOneCatStore($catStore: ID){
getOneCatStore(catStore: $catStore){
  catStore
  idUser
  cName
  cState
  createdAt
  cPathImage
  updatedAt
  csDescription
  getAllStore {
      idStore
      cId
      id
      dId
      ctId
      catStore
      neighborhoodStore
      Viaprincipal
      storeOwner
      storeName
      emailStore
      storePhone
      socialRaz
      Image
      banner
      documentIdentifier
      uPhoNum
      ULocation
      upLat
      upLon
      uState
      siteWeb
      description
      NitStore
      typeRegiments
      typeContribute
      secVia
      addressStore
      createdAt
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
      getAllRatingStar {
      rSId
      rScore
      idStore
      createAt
      
    }
  }
  }
}
`
