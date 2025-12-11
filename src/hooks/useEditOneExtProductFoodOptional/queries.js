import { gql } from '@apollo/client'

export const UPDATE_EXT_PRODUCT_FOOD_OPTIONAL = gql`
mutation editExtProductFoodOptional($input: EditExtProductFoodOptionalInput!) {
    editExtProductFoodOptional(input: $input) {
      pId
      opExPid
      OptionalProName
      state
      code
      required
      numbersOptionalOnly
      pDatMod
    }
  }
`
