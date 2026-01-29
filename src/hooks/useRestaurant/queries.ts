import { gql } from '@apollo/client'
export const GET_ALL_RESTAURANT = gql`
query getAllStoreInStore($search: String, $min: Int, $max: Int){
  getAllStoreInStore(search: $search, min: $min, max: $max) {
    open
    scheduleOpenAll
    getStoreSchedules {
      idStore
      schId
      schDay
      schHoSta
      schHoEnd
      schState
    }
    idStore
    cId
    id
    dId
    deliveryTimeMinutes
    ctId
    catStore
    neighborhoodStore
    Viaprincipal
    storeOwner
    storeName
    cateStore{
      catStore
      cName
    }
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
    getAllRatingStar {
      rSId
      rScore
      idStore
      createAt
    }
  }
}
`
