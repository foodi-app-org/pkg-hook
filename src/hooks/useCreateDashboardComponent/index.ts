import { gql, useMutation } from '@apollo/client'

const CREATE_DASHBOARD_COMPONENT = gql`
  mutation CreateDashboardComponent($input: DashboardComponentInput!) {
    createDashboardComponent(input: $input) {
      success
      message
      data {
        id
        idStore
        coordinates
        title
      }
      errors {
        path
        message
        type
      }
    }
  }
`

interface DashboardComponentCoordinates {
  x?: number
  y?: number
  w?: number
  h?: number
  static?: boolean
}

interface CreateDashboardComponentInput {
  idStore?: string
  title?: string
  coordinates: DashboardComponentCoordinates
}

interface DashboardComponentData {
  id: string
  idStore: string
  coordinates: unknown
  title: string
}

interface CreateDashboardComponentResponse {
  createDashboardComponent: {
    success: boolean
    message?: string
    data?: DashboardComponentData
    errors?: Array<{ path: string; message: string; type: string }>
  }
}

export const useCreateDashboardComponent = () => {
  const [mutate, { loading, error }] = useMutation<
    CreateDashboardComponentResponse,
    { input: CreateDashboardComponentInput }
  >(CREATE_DASHBOARD_COMPONENT)

  const createComponent = async (input: CreateDashboardComponentInput) => {
    const response = await mutate({ variables: { input } })
    return response.data?.createDashboardComponent
  }

  return [createComponent, { loading, error }]
}
