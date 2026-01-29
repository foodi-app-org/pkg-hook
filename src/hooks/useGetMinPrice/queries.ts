import { gql } from '@apollo/client'

export const GET_MIN_PEDIDO = gql`
query getMinPrice($idStore: ID){
getMinPrice(idStore: $idStore)
}
`
