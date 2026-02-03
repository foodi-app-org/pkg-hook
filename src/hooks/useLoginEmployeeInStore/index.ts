import { gql, useMutation } from '@apollo/client'

const LOGIN_EMPLOYEE_IN_STORE = gql`
  mutation loginEmployeeInStore($eId: ID, $tenantId: String, $idStore: ID, $idUser: ID, $eEmail: String) {
    loginEmployeeInStore(eId: $eId, tenantId: $tenantId, idStore: $idStore, idUser: $idUser, eEmail: $eEmail) {
      success
      message
      token
      idStore
    }
  }
`

export const useLoginEmployeeInStore = () => {
  const [loginEmployeeInStore, { data, loading, error }] = useMutation(LOGIN_EMPLOYEE_IN_STORE)

  const loginEmployee = async (idStore: string, eEmail: string) => {
    const response = await loginEmployeeInStore({
      variables: {
        idStore,
        eEmail
      }
    })
    return response.data.loginEmployeeInStore
  }

  return {
    loginEmployee,
    data,
    loading,
    error
  }
}
