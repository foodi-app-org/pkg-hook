import { gql } from '@apollo/client'

export const DELETE_CAT_EXTRA_PRODUCTS = gql`
  mutation DeleteExtProductFoodsOptional($opExPid: ID, $state: Int, $isCustomOpExPid: Boolean) {
    DeleteExtProductFoodsOptional(opExPid: $opExPid, state: $state, isCustomOpExPid: $isCustomOpExPid) {
      success
      message
    }
  }
`

export const GET_EXTRAS_PRODUCT_FOOD_OPTIONAL = gql`
  query ExtProductFoodsOptionalAll(
    $search: String
    $min: Int
    $max: Int
    $pId: ID
  ) {
    ExtProductFoodsOptionalAll(
      search: $search
      min: $min
      max: $max
      pId: $pId
    ) {
      pId
      opExPid
      OptionalProName
      state
      code
      numbersOptionalOnly
      pDatCre
      required
      pDatMod
      ExtProductFoodsSubOptionalAll {
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
  }
`
