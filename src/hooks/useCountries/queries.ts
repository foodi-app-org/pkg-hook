import { gql } from '@apollo/client'

export const GET_ALL_COUNTRIES = gql`
    query countries {
        countries {
            cId
            cName
            cCalCod
            cState
        }
    }
`
