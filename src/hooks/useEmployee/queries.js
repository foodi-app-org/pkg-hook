import { gql } from '@apollo/client'

export const GET_EMPLOYEES = gql`
query employees {
  employees {
    eId
    idStore
    idEmployee
    eSalary
    typeContract
    tpEmail
    termContract
    eDatAdm
    eState
  }
}
`