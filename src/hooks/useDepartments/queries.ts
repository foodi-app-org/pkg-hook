import { gql } from '@apollo/client'

export const GET_ALL_DEPARTMENTS = gql`
    query getAllDepartments($cId: ID!) {
        getAllDepartments(cId: $cId) {
        dId
        cId
        dName
        dState
        code_dId
        }
    }
`
