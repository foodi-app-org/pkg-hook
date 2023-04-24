import { gql } from '@apollo/client'

export const CREATE_CONTACTS = gql`
mutation createContacts ($input: IContacts) {
  createContacts(input: $input) {
    success
    message
  }
}
`
export const GET_ALL_CONTACTS = gql`
query getAllContacts($idStore: ID, $cId: ID, $dId: ID, $ctId: ID, $search: String, $min: Int, $pState: Int,  $max: Int) {
  getAllContacts(idStore: $idStore, cId: $cId, dId: $dId, ctId: $ctId, search: $search, min: $min, pState: $pState,  max: $max) {
    contactId
    cntState
    cntComments
    cntNumberPhone
    cntName
    createAt
    updateAt
  }
}
`

export const GET_ONE_CONTACT = gql`
query getOneContacts($contactId: String) {
  getOneContacts(contactId: $contactId) {
    contactId
    id
    idStore
    cntName
    cntComments
    cntNumberPhone
    cntState
    createAt
    updateAt
  }
}
`

export const EDIT_ONE_CONTACT = gql`
mutation editOneContacts($input: IContacts) {
  editOneContacts(input: $input) {
    success
    message
  }
}
`