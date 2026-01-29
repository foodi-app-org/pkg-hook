import { gql } from '@apollo/client'

export const EDIT_EXTRA_SUB_OPTIONAL_PRODUCTS = gql`
mutation  editExtFoodSubsOptional($opSubExPid: ID, $state: Int, $isCustomSubOpExPid: Boolean, $OptionalSubProName: String){
  editExtFoodSubsOptional(opSubExPid: $opSubExPid, state: $state, isCustomSubOpExPid: $isCustomSubOpExPid, OptionalSubProName: $OptionalSubProName){
    success,
    message
  }
}
`
