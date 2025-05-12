import { gql } from '@apollo/client'

export const CHANGE_STATE_STORE_PEDIDO = gql`
mutation changePPStatePPedido($pPStateP: Int, $pCodeRef: String, $pDatMod: String) {
  changePPStatePPedido(pPStateP: $pPStateP, pCodeRef: $pCodeRef,  pDatMod: $pDatMod){
    success
    message
  }
}

`
export const GET_ALL_PEDIDOS = gql`
query getStoreOrdersFinal($idStore: ID, $search: String, $min: Int, $max: Int, $statusOrder: Int, $fromDate:  DateTime, $toDate:  DateTime) {
  getStoreOrdersFinal(idStore: $idStore, search: $search, min: $min, max: $max, statusOrder: $statusOrder, toDate: $toDate,fromDate: $fromDate ) {
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
    getStoreOrders{
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
    ACCEPT {
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
    PROCESSING {
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
    READY {
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
    CONCLUDES {
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
    REJECTED {
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
