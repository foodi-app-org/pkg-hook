import { gql } from '@apollo/client'

export const GET_ALL_CATEGORIES_WITH_PRODUCT_CLIENTS = gql`
query getCatProductsWithProductClient($search: String, $min: Int, $max: Int, $gender: [String], $desc: [String], $categories: [ID], $carProId: ID $idStore: ID ) {
  getCatProductsWithProductClient(search: $search, min: $min, max: $max, gender: $gender, desc: $desc, categories: $categories, carProId: $carProId idStore: $idStore) {
    carProId
    pState
    pState
    ProImage
    idStore
    pName
    ProDescription
    ProImage
    pState
    pDatCre
    pDatMod
    productFoodsAll {
         pId
        sizeId
        colorId
        carProId
        cId
        dId
        ValueDelivery
        ctId
        idStore
        caId
        fId
        pName
        ProPrice
        ProDescuento
        ProUniDisponibles
        ProDescription
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
    
  }
}
`
