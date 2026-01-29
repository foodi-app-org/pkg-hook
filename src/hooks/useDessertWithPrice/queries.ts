import { gql } from '@apollo/client'

export const DELETE_EXTRA_PRODUCTS = gql`
  mutation  deleteExtraProduct($id: ID, $state: Int){
    deleteExtraProduct(id: $id, state: $state){
      success,
      message
  }
}
`
export const EDIT_EXTRA_PRODUCT_FOODS = gql`
  mutation EditExtraProductFoods($exPid: ID, $state: Int, $extraName: String, $extraPrice: Float) {
    editExtraProductFoods(exPid: $exPid, state: $state, extraName: $extraName, extraPrice: $extraPrice) {
      success
      message
    }
  }
`
