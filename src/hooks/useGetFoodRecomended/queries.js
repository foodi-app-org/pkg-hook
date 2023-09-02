import { gql } from '@apollo/client'

export const GET_ALL_PRODUCT_STORE_RECOMENDED = gql`
query productFoodsAllRecommended($search: String, $min: Int, $max: Int, $gender: [String], $desc: [String], $categories: [ID], ) {
  productFoodsAllRecommended(search: $search, min: $min, max: $max, gender: $gender, desc: $desc, categories: $categories,) {
    pId
    sizeId #Talla
    colorId #Color
    cId  #Country
    dId  #Department
    ctId  #Cuidad
    fId  #Características
    pName
    ProPrice
    ProDescuento
  ProUniDisponibles
  ProDescription
  ProProtegido
  ProAssurance
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
