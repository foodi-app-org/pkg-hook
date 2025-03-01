import { gql } from '@apollo/client'

export const LOGIN = gql`
mutation login($input: LoginInput){
  login(input: $input){
    token
  }
}
`
export const GET_USER_PROFILE = gql`
query getOneUserProfile($id: ID) {
  getOneUserProfile(id: $id){
      upId
      id
      upPhone
      upImage
      upDateBir
      upBloodG
      upAddress
      ctId
      dId
      upZipCode
      cId
      upLatitude
      upLongitude
      user {
      id
      name
      username
      lastName
      email
      avatar
      uToken
      uPhoNum
      ULocation
      upLat
      uState
      upLon
      upIdeDoc
      siteWeb
      description
      password
      createAt

      }
  }
}
`

export const GET_USER = gql`
query getUser($id: ID, $email: String){
getUser(id: $id email: $email){
id
name
username
lastName
email
avatar
uToken
uPhoNum
ULocation
upLat
uState
idRole
upLon
upIdeDoc
siteWeb
description
associateStore
createAt
  role {
    name
    permissions
    description
    createdAt
    updatedAt
    
  }
}
}
`
export const GET_ALL_USER = gql`
query getAllUser($search: String){
  getAllUser(search: $search){
    id
    name
    username
    lastName
    email
    email
    siteWeb
    description
    uPhoNum
    upLat
    upLon
    createAt
    avatar
    latestMessage {
      uuid
      content
      from
      to
    }
  }
}
`
export const UPDATE_AVATAR = gql`
mutation updateAvatar($file: Upload){
  UpdateAvatar(file: $file){
    status
    urlAvatar
  }
}
`

export const SET_USER_PROFILE = gql`
    mutation setUserProfile($data: IUserProfile!) {
        setUserProfile(input: $data){
            upId
            id
            upPhone
            upDateBir
            upImage
            upBloodG
            cId
            ctId
            dId
            upAddress
            upZipCode
        }
    }
`
