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
    payMethodPState
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
        payMethodPState
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

export const GET_ALL_PEDIDOS_FROM_STORE = gql`
query getAllOrdersFromStore(
  $idStore: ID
  $cId: ID
  $dId: ID
  $ctId: ID
  $search: String
  $min: Int
  $fromDate: DateTime
  $toDate: DateTime
  $max: Int
  $statusOrder: Int
) {
  getAllOrdersFromStore(
    idStore: $idStore
    cId: $cId
    dId: $dId
    ctId: $ctId
    search: $search
    min: $min
    fromDate: $fromDate
    toDate: $toDate
    max: $max
    statusOrder: $statusOrder
  ) {
    statusKey
    priority
    state
    getStatusOrderType {
      idStatus
      backgroundColor
      name
      description
      color
      priority
      state
      createdAt
      updatedAt
    }
    items {
      pdpId
      idStore
      pCodeRef
      payMethodPState
      pPRecoger
      totalProductsPrice
      pSState
      pDatCre
      channel
      locationUser
      pDatMod
      getStatusOrderType {
        idStatus
        name
        description
        backgroundColor
        color
        priority
        state
        createdAt
        updatedAt
      }
      getStoreOrders {
        pdpId
        pId
        idStore
        ShoppingCard
        pCodeRef
        pPStateP
        payMethodPState
        pPRecoger
        pDatCre
        pDatMod
        getAllShoppingCard {
          ShoppingCard
          comments
          cantProducts
          pId
          productFood {
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
}

`
