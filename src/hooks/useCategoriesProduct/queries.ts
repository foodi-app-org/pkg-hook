import { gql } from '@apollo/client'

export const GET_ULTIMATE_CATEGORY_PRODUCTS = gql`
query catProductsAll($search: String, $min: Int, $max: Int, $gender: [String], $desc: [String], $categories: [ID], ) {
  catProductsAll(search: $search, min: $min, max: $max, gender: $gender, desc: $desc, categories: $categories,) {
    carProId
    idStore
    pName
    ProDescription
    ProImage
    pState
    createdAt
    updatedAt
  }
}
`
