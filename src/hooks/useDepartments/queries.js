import gql from 'graphql-tag'

export const GET_ALL_DEPARTMENTS = gql`
    query getAllDepartments($cId: ID!) {
        departments(cId: $cId) {
            dId
            cId
            dName
            dState
        }
    }
`
