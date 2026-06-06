import { gql, useMutation } from '@apollo/client'

const DELETE_DASHBOARD_COMPONENT = gql`
  mutation DeleteDashboardComponent($id: ID!) {
    deleteDashboardComponent(id: $id) {
      success
      message
      id
    }
  }
`

interface DeleteDashboardComponentResponse {
  deleteDashboardComponent: {
    success: boolean
    message?: string
    id?: string
  }
}

export const useDeleteDashboardComponent = () => {
  const [mutate, { loading, error }] = useMutation<
    DeleteDashboardComponentResponse,
    { id: string }
  >(DELETE_DASHBOARD_COMPONENT)

  const deleteComponent = async (id: string) => {
    const response = await mutate({ variables: { id } })
    return response.data?.deleteDashboardComponent
  }

  return[deleteComponent, { loading, error }]
}
