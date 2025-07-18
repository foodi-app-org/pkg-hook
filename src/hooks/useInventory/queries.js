import { useQuery, gql } from "@apollo/client";

export const GET_PRODUCTS_IN_STOCK = gql`
query getProductsInStock($limit: Int, $offset: Int) {
  getProductsInStock(limit: $limit, offset: $offset) {
        pId
      sizeId #Talla
      colorId #Color
      carProId #Categoria a la cual pertenece el producto
      caId
      cId #Country
      dId #Department
      ctId #Cuidad
      fId #Características
      pName
      getOneTags {
        tgId
        idUser
        idStore
        pId
        nameTag
      }
      ProPrice
      ProDescuento
      free
      ProUniDisponibles
      ProDescription
      ProProtegido
      ProAssurance
      ValueDelivery
      ProStar
      sTateLogistic
      ProImage
      ProWidth
      ProHeight
      ProLength
      ProWeight
      ProQuantity
      ProOutstanding
      pDatCre
      pDatMod
      ProDelivery
      ProVoltaje
      pState
      feat {
        fId
        thpId
        hpqrQuestion
      }
      area {
        aId
        aName
      }
       
  }
}

`