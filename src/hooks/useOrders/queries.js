import { gql } from '@apollo/client'

export const CHANGE_STATE_STORE_ORDER = gql`
mutation changePPStateOrder($pPStateP: Int, $pCodeRef: String, $pDatMod: String) {
  changePPStateOrder(pPStateP: $pPStateP, pCodeRef: $pCodeRef,  pDatMod: $pDatMod){
    success
    message
  }
}

`
export const GET_ALL_ORDER = gql`
query getAllOrderStoreFinal($idStore: ID, $search: String, $min: Int, $max: Int, $statusOrder: Int, $fromDate:  DateTime, $toDate:  DateTime) {
  getAllOrderStoreFinal(idStore: $idStore, search: $search, min: $min, max: $max, statusOrder: $statusOrder, toDate: $toDate,fromDate: $fromDate ) {
    pdpId
    idStore
    pCodeRef
    payId
    pPRecoger
    totalProductsPrice
    pSState
    pDatCre
    channel
    locationUser
    pDatMod
    getAllPedidoStore{
        pdpId
        pId
        idStore
        ShoppingCard
        pCodeRef
        pPStateP
        payId
        pPRecoger
        pDatCre
        pDatMod
        getAllShoppingCard {
          ShoppingCard
          comments
          cantProducts
          pId
        productFood{
          pId
          carProId
          colorId
          idStore
          pName
          ProPrice
          ProDescuento
          ProDescription
          ValueDelivery
          ProImage
          ProStar
          pState
          pDatCre
          pDatMod
        }
      }
    }
  }
}
`

export const GET_ALL_ORDER_FROM_STORE = gql`
query getAllSalesStore {
  getAllSalesStore {
    change
    channel
    status
    createdAt
    pCodeRef
    idStore
    pdpId
    locationUser
    shoppingCartRefCode
    statusOrder {
      idStatus
      name
      description
      color
      backgroundColor
      priority
      state
      createdAt
      updatedAt
    }
    updatedAt
    totalProductsPrice
    unidProducts
    getUser {
      associateStore
      avatar
      createdAt
      id
      email
    }
  }
}
`
