import { gql } from '@apollo/client'

export const UPDATE_MULTIPLE_PRODUCTS = gql`
  mutation updateMultipleProducts($input: [InputProductFood]) {
    updateMultipleProducts(input: $input) {
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
        pId
        sizeId
        colorId
        cId
        dId
        ctId
        fId
        pName
        pCode
        ProPrice
        carProId
        ProDescuento
        ProUniDisponibles
        ValueDelivery
        ProDescription
        ProProtegido
        ProAssurance
        ProStar
        pState
        ProImage
        ProWidth
        ProHeight
        ProLength
        ProWeight
        ProQuantity
        ProOutstanding
        ProDelivery
        ProVoltaje
      }
    }
  }
`
