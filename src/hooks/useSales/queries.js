import { gql } from '@apollo/client'

export const GET_ALL_SALES = gql`
  query getAllSalesStore(
    $idStore: ID
    $search: String
    $min: Int
    $max: Int
    $fromDate: String
    $toDate: String
  ) {
    getAllSalesStore(
      idStore: $idStore
      search: $search
      min: $min
      max: $max
      toDate: $toDate
      fromDate: $fromDate
    ) {
      totalProductsPrice
      pDatCre
    }
  }
`

export const GET_ALL_COUNT_SALES = gql`
  query getTodaySales {
    getTodaySales
  }
`
export const GET_ALL_SALES_STATISTICS = gql`
  query getAllSalesStoreStatistic(
    $idStore: ID
    $search: String
    $min: Int
    $max: Int
    $fromDate: DateTime
    $toDate: DateTime
  ) {
    getAllSalesStoreStatistic(
      idStore: $idStore
      search: $search
      min: $min
      max: $max
      toDate: $toDate
      fromDate: $fromDate
    ) {
      pdpId
      idStore
      pCodeRef
      payMethodPState
      pPRecoger
      totalProductsPrice
      pSState
      pDatCre
      locationUser
      pDatMod
      getAllPedidoStore {
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
`

export const GET_ONE_SALES = gql`
  query getOnePedidoStore($pCodeRef: String) {
    getOnePedidoStore(pCodeRef: $pCodeRef) {
      pdpId
      pCodeRef
      idStore
      pPDate
      channel
      pSState
      pDatCre
      pDatMod
      pPRecoger
      payMethodPState
      pdpId
      totalProductsPrice
      locationUser
      getAllPedidoStore {
        pdpId
        idStore
        pCodeRef
        ShoppingCard
        getAllShoppingCard {
          ShoppingCard
          cantProducts
          subProductsId
          comments
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
`

export const CREATE_CLIENTS = gql`
  mutation createClients($input: IClients) {
    createClients(input: $input) {
      cliId
      idStore
      idUser
      clState
      ClientAddress
      clientNumber
      ccClient
      gender
      clientLastName
      clientName
      createAt
      updateAt
    }
  }
`
export const DELETE_ONE_CLIENTS = gql`
  mutation deleteClient($cliId: ID, $clState: Int!) {
    deleteClient(cliId: $cliId, clState: $clState) {
      success
      message
    }
  }
`
export const GET_ALL_CLIENTS = gql`
  query getAllClients(
    $idStore: ID
    $cId: ID
    $dId: ID
    $ctId: ID
    $search: String
    $min: Int
    $max: Int
    $fromDate: DateTime
    $toDate: DateTime
  ) {
    getAllClients(
      idStore: $idStore
      cId: $cId
      dId: $dId
      ctId: $ctId
      search: $search
      min: $min
      max: $max
      fromDate: $fromDate
      toDate: $toDate
    ) {
      cliId
      idStore
      gender
      # idUser
      clState
      clientNumber
      ccClient
      clientLastName
      clientName
      ClientAddress
      createAt
      updateAt
    }
  }
`
export const GET_ONE_CLIENT = gql`
  query getOneClients($cliId: ID) {
    getOneClients(cliId: $cliId) {
      cliId
      idStore
      idUser
      clState
      clientNumber
      ClientAddress
      gender
      ccClient
      clientLastName
      clientName
      createAt
      updateAt
    }
  }
`

export const CREATE_SHOPPING_CARD = gql`
  mutation registerShoppingCard(
    $input: IShoppingCard
    $idSubArray: IID_SUB_ITEMS
  ) {
    registerShoppingCard(input: $input, idSubArray: $idSubArray) {
      ShoppingCard
      id
      pId
      subProductsId
      ShoppingCardRefCode
      uuid
      discountCardProduct
      idUser
      cName
      idStore
      cState
      cDatCre
      cDatMod
      csDescription
      cantProducts
      comments
      # idSubArray
    }
  }
`
export const GET_ONE_SALE = gql`
  query getOnePedidoStore($pCodeRef: String) {
    getOnePedidoStore(pCodeRef: $pCodeRef) {
      pdpId
      pCodeRef
      idStore
      pPDate
      channel
      pSState
      pDatCre
      pDatMod
      pPRecoger
      payMethodPState
      pdpId
      totalProductsPrice
      locationUser
      getAllPedidoStore {
        pdpId
        idStore
        pCodeRef
        ShoppingCard
        getAllShoppingCard {
          ShoppingCard
          cantProducts
          priceProduct
          refCodePid
          subProductsId
          comments
          pId
          salesExtProductFoodOptional {
            pId
            opExPid
            OptionalProName
            state
            code
            required
            numbersOptionalOnly
            pDatCre
            pDatMod
            saleExtProductFoodsSubOptionalAll {
              pId
              opExPid
              idStore
              opSubExPid
              OptionalSubProName
              exCodeOptionExtra
              exCode
              state
              pDatCre
              pDatMod
            }
          }
          ExtProductFoodsAll {
            pId
            exPid
            exState
            extraName
            extraPrice
            newExtraPrice
            quantity
            state
            pDatCre
            pDatMod
          }
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
`

export const CREATE_SHOPPING_CARD_TO_USER_STORE = gql`
  mutation registerSalesStore(
    $input: [IShoppingCard]
    $id: ID
    $idStore: ID
    $pCodeRef: String
    $discount: Int
    $change: Float
    $tableId: ID
    $valueDelivery: Float
    $payMethodPState: Int
    $pickUp: Int
    $totalProductsPrice: Float
    $idSubArray: IID_SUB_ITEMS
  ) {
    registerSalesStore(
      input: $input
      id: $id
      idStore: $idStore
      pCodeRef: $pCodeRef
      change: $change
      tableId: $tableId
      discount: $discount
      valueDelivery: $valueDelivery
      payMethodPState: $payMethodPState
      pickUp: $pickUp
      totalProductsPrice: $totalProductsPrice
      idSubArray: $idSubArray
    ) {
      ShoppingCard {
        ShoppingCard
        id
        pId
        subProductsId
        ShoppingCardRefCode
        uuid
        discountCardProduct
        idUser
        cName
        idStore
        cState
        cDatCre
        cDatMod
        csDescription
        cantProducts
        comments
      }
      Response {
        success
        message
      }
    }
  }
`

export const GET_ALL_PEDIDOS = gql`
query getAllPedidoStoreFinal($idStore: ID, $search: String, $min: Int, $max: Int, $statusOrder: Int) {
  getAllPedidoStoreFinal(idStore: $idStore, search: $search, min: $min, max: $max, statusOrder: $statusOrder) {
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
          priceProduct
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
