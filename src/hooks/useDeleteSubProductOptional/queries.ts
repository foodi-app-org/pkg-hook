import { gql } from '@apollo/client'

export const DELETE_CAT_EXTRA_SUB_OPTIONAL_PRODUCTS = gql`
mutation  DeleteExtFoodSubsOptional($opSubExPid: ID, $state: Int, $isCustomSubOpExPid: Boolean){
  DeleteExtFoodSubsOptional(opSubExPid: $opSubExPid, state: $state, isCustomSubOpExPid: $isCustomSubOpExPid){
    success, 
    message
}
}
`
