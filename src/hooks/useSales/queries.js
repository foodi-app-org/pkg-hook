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
      payId
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
        payId
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
query getOneSalesStore($pCodeRef: String) {
  getOneSalesStore(pCodeRef: $pCodeRef) {
    message
    message
    errors {
      message
      path
      type
      context {
        key
        label
        limit
        value
        __typename
      }
    }
    data {
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
      paymentMethod {
        payId
        name
        icon
        state
        paymentPriority
        createdAt
        updatedAt
      }
      totals {
        name
        value
      }
      createdAt
      change
      channel
      pCodeRef
      id
      locationUser
      pCodeRef
      pdpId
      ppState
      ppState
      shoppingCartRefCode
      pSState
      totalProductsPrice
      unidProducts
      updatedAt
      createdAt
      store {
        addressStore
        banner
        cId
        createdAt
        dailyGoal
        description
        upLon
        upLat
        deliveryTimeMinutes
        emailStore
        documentIdentifier
        Viaprincipal
        uState
      }
      client {
        cliId
        idStore
        idUser
        clState
        clientNumber
        ClientAddress
        ccClient
        gender
        clientLastName
        clientName
        createAt
        updateAt
      }
      shoppingCarts {
        shoppingCartId
        id
        pId
        shoppingCartRefCode
        priceProduct
        comments
        cantProducts
        refCodePid
        idUser
        idStore
        sState
        createdAt
        updatedAt
        products {
          pId
          carProId
          sizeId
          colorId
          idStore
          cId
          caId
          dId
          ctId
          tpId
          fId
          pName
          pCode
          ProPrice
          free
          ProDescuento
          ProUniDisponibles
          ProDescription
          ValueDelivery
          ProProtegido
          ProAssurance
          ProImage
          ProStar
          ProWidth
          ProHeight
          ProLength
          ProWeight
          ProQuantity
          ProOutstanding
          ProDelivery
          ProVoltaje
          pState
          tgId
          sTateLogistic
          ProBarCode
          stock
          manageStock
          vat
          ExtProductFoodOptional {
            pId
            opExPid
            OptionalProName
            state
            code
            required
            numbersOptionalOnly
            createdAt
            updatedAt
            ExtProductFoodsSubOptionalAll {
              pId
              opExPid
              idStore
              opSubExPid
              OptionalSubProName
              exCodeOptionExtra
              exCode
              state
            }
          }
          ExtProductFoodsAll {
            pId
            exPid
            exState
            extraName
            extraPrice
            quantity
            newExtraPrice
            state
            createdAt
            updatedAt
          }
          createdAt
          updatedAt
        }
      }
      __typename
    }
  }
}
`
export const CREATE_SHOPPING_CARD_TO_USER_STORE = gql`
mutation registerSalesStore(
  $input: [IShoppingCart]
  $id: ID
  $tableId: ID
  $discount: Int
  $idStore: ID
  $pCodeRef: String
  $change: Float
  $shoppingCartRefCode: String
  $payId: ID
  $pickUp: Int
  $totalProductsPrice: Float
  $valueDelivery: Float
  $idSubArray: IID_SUB_ITEMS
) {
  registerSalesStore(
    input: $input
    id: $id
    tableId: $tableId
    discount: $discount
    shoppingCartRefCode: $shoppingCartRefCode
    idStore: $idStore
    pCodeRef: $pCodeRef
    change: $change

    payId: $payId
    pickUp: $pickUp
    totalProductsPrice: $totalProductsPrice
    valueDelivery: $valueDelivery
    idSubArray: $idSubArray
  ) {
    success
    message
    errors {
      path
      message
      type
      context {
        limit
        value
        label
        key
        __typename
      }
    }
    data {
      pCodeRef
      idStore
      id
      channel
      payId
      pSState
      createdAt
      updatedAt
      unidProducts
      totalProductsPrice
      getOneStore {
        idStore
        cId
        dId
        catStore
        scheduleOpenAll
        dailyGoal
        deliveryTimeMinutes
      }
      getUser {
        id
        name
        email
        createdAt
        updatedAt
        __typename
      }
    }
  }
}
`

export const GET_ALL_ORDER = gql`
query getAllOrderStoreFinal($idStore: ID, $search: String, $min: Int, $max: Int, $statusOrder: Int) {
  getAllOrderStoreFinal(idStore: $idStore, search: $search, min: $min, max: $max, statusOrder: $statusOrder) {
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
