import { gql } from '@apollo/client'

export const CREATE_STORE_PENDING_TO_REGISTER = gql`
  mutation createStorePendingToRegister($input: StorePendingToRegisterInput) {
    createStorePendingToRegister(input: $input) {
      success
      message
    }
  }
`
