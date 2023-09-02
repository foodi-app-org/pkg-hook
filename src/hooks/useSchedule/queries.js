import { gql } from '@apollo/client'

export const CREATE_STORE_CALENDAR = gql`
mutation  setStoreSchedule($input: ITstoreSchedule!){
  setStoreSchedule(input: $input){
    message
    success
  }
}
`
export const GET_SCHEDULE_STORE = gql`
  query getStoreSchedules($schDay: Int, $idStore: ID) {
    getStoreSchedules(schDay: $schDay, idStore: $idStore) {
      schId
      idStore
      schDay
      schHoSta
      schHoEnd
      schState
    }
  }
`

export const GET_ONE_SCHEDULE_STORE = gql`
  query getOneStoreSchedules($schDay: Int, $idStore: ID) {
    getOneStoreSchedules(schDay: $schDay, idStore: $idStore) {
      schId
      schDay
      schHoSta
      schHoEnd
      schState
    }
  }
`
