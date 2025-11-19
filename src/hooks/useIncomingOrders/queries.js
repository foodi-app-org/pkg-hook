import { gql } from '@apollo/client'

export const GET_ALL_INCOMING_ORDERS = gql`
  query getAllIncomingToDayOrders($statusOrder: Int, $idStore: ID) {
    getAllIncomingToDayOrders(statusOrder: $statusOrder, idStore: $idStore) {
      pdpId
      pCodeRef
      idStore
      pPDate
      channel
      pSState
      pDatCre
      pDatMod
      pPRecoger
      payId
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
