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
    try {
      const response = await loginEmployeeInStore({
        variables: {
          idStore,
          eEmail
        }
      })
      return response.data.loginEmployeeInStore
    } catch (err) {
      console.error('Error during loginEmployeeInStore mutation:', err)
      throw err
    }
  }

  return {
    loginEmployee,
    data,
    loading,
    error
  }
}
