import { gql } from '@apollo/client'

export const DELETE_ONE_ITEM_SHOPPING_PRODUCT = gql`
mutation deleteOneItem($cState: Int, $ShoppingCard: ID) {
  deleteOneItem(cState: $cState, ShoppingCard: $ShoppingCard){
    success
    message
  }
}
`
