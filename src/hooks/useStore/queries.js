import { gql } from '@apollo/client'

export const CREATE_ONE_STORE = gql`
mutation  newRegisterStore($input: IStore){
  newRegisterStore(input: $input){
    success
    message
    idStore
  }
}
`

export const GET_ONE_STORE = gql`
query getStore($id: ID, $idStore: ID){
 getStore(id: $id, idStore: $idStore){
cId
id
dId
idStore
ctId
neighborhoodStore
Viaprincipal
catStore
storeOwner
storeName
ImageName
emailStore
storePhone
socialRaz
Image
banner
  
documentIdentifier
uPhoNum
storeName
ULocation
upLat
upLon
uState
siteWeb
  
description
createdAt
secVia
NitStore
typeRegiments
typeContribute
addressStore
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
  getStoreSchedules {
      idStore
      schId
      id
      schDay
      schHoSta
      schHoEnd
      schState
  }
  cateStore {
    catStore
    cName
    cState
    cDatCre
    cDatMod
    csDescription
    
  }
}
}
`
export const GET_ONE_STORE_BY_ID = gql`
query getOneStore($StoreName: String, $idStore: ID){
  getOneStore(idStore: $idStore, StoreName: $StoreName) {
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
    pais{
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
    cateStore {
      catStore
      idUser
      cName
      cState
      cDatCre
      cDatMod
      csDescription
      
    }
  }
}
`
