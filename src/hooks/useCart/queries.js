import { gql } from '@apollo/client';

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
    }
  }
`

export const GET_ALL_SHOPPING_CARD = gql`
  query getAllShoppingCard {
    getAllShoppingCard {
      ShoppingCard
      cState
      idStore
      refCodePid
      pId
      comments
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
        quantity
        newExtraPrice
        state
        pDatCre
        pDatMod
      }
      productFood {
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
        ProPrice
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
        sTateLogistic
        pDatCre
        pDatMod
      }
      cantProducts
      getStore {
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
        }
        department {
          dId
          cId
          dName
          dState
          dDatCre
          dDatMod
        }
      }
    }
  }
`
