import { gql } from '@apollo/client'

export const CREATE_CLIENTS = gql`
mutation createClients ($input: IClients) {
  createClients(input: $input) {
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
      }
    }
    data {
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
query getAllClients($idStore: ID, $search: String, $min: Int, $max: Int, $fromDate: DateTime, $toDate: DateTime, $page: Int) {
  getAllClients(idStore: $idStore, search: $search, min: $min, max: $max, fromDate: $fromDate, toDate: $toDate, page: $page) {
    success
    message
    data {
      cliId
      idStore
      gender
      clState
      clientNumber
      ccClient
      clientLastName
      
      clientName
      createAt
      updateAt
    }
    pagination {
      totalRecords
      totalPages
      currentPage
    }
    errors {
      path
      message
      type
      context {
        limit
        value
        label
        key
      }
    }
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

export const EDIT_ONE_CLIENT = gql`
mutation editOneClient($input: IClients) {
  editOneClient(input: $input) {
    success
    message
  }
}
`

export const CREATE_SHOPPING_CARD = gql`
mutation  registerShoppingCard($input: IShoppingCard, $idSubArray: IID_SUB_ITEMS){
    registerShoppingCard(input: $input, idSubArray: $idSubArray){
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
  $payMethodPState: Int
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

    payMethodPState: $payMethodPState
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
      payMethodPState
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
