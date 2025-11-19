import { gql } from '@apollo/client'

export const GET_ALL_SALES = gql`
query getAllSalesStore($idStore: ID,$search: String, $min: Int, $max: Int $fromDate: String, $toDate: String ) {
  getAllSalesStore(idStore: $idStore, search: $search, min: $min, max: $max, toDate: $toDate, fromDate: $fromDate) {
    totalProductsPrice
    channel
    pDatCre
    pCodeRef
  }
}
`

export const GET_ALL_TOTAL_SALES = gql`
query getAllSalesStoreTotal($idStore: ID,$search: String, $min: Int, $max: Int $fromDate: String, $toDate: String) {
    getAllSalesStoreTotal(idStore: $idStore, search: $search, min: $min, max: $max, toDate: $toDate, fromDate: $fromDate) {
    restaurant
    delivery
    TOTAL
  }
}
`
export const GET_ALL_SALES_STATISTICS = gql`
query getAllSalesStoreStatistic($idStore: ID,$search: String, $min: Int, $max: Int $fromDate: DateTime, $toDate: DateTime ) {
  getAllSalesStoreStatistic(idStore: $idStore, search: $search, min: $min, max: $max, toDate: $toDate, fromDate: $fromDate) {
    pdpId
    idStore
    pCodeRef
    payId
    pPRecoger
    totalProductsPrice
    pSState
    pDatCre
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

export const GET_ONE_SALES = gql`
query getOneSalesStore($pCodeRef: String) {
  getOneSalesStore(pCodeRef: $pCodeRef) {
    pdpId
    idStore
    pCodeRef
    payId
    pPRecoger
    totalProductsPrice
    pSState
    pDatCre
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
