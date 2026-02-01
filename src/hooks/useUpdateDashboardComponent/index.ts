import { gql, useMutation } from '@apollo/client'

/**
 * GraphQL mutation for updating a dashboard component.
 */
const UPDATE_DASHBOARD_COMPONENT = gql`
  mutation UpdateDashboardComponent($input: [DashboardComponentUpdateInput]) {
    updateDashboardComponent(input: $input) {
      success
      message
      data {
        id
        idStore
        idUser
        coordinates
        createAt
        updateAt
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

/**
 * Types for the mutation response and input.
 */
interface DashboardComponent {
  id: string;
  idStore: string;
  idUser: string;
  coordinates: unknown;
  createAt: string;
  updateAt: string;
  title: string;
}

interface ErrorResponse {
  message: string;
  field?: string;
}

interface UpdateDashboardComponentResponse {
  updateDashboardComponent: {
    success: boolean;
    message?: string;
    data?: DashboardComponent;
    errors?: ErrorResponse[];
  };
}

interface UpdateDashboardComponentInput {
  id: string;
  coordinates?: unknown;
  title?: string;
}

/**
 * Custom hook to update a dashboard component.
 * @returns An object containing the update function, loading state, error, and data.
 */
export const useUpdateDashboardComponent = () => {
  const [mutate, { loading, error, data }] = useMutation<
    UpdateDashboardComponentResponse,
    { input: UpdateDashboardComponentInput[] }
  >(UPDATE_DASHBOARD_COMPONENT)

  /**
   * Calls the mutation with the provided input.
   * @param input DashboardComponentUpdateInput
   * @returns Promise resolving to the mutation response.
   */
  const updateComponent = async (input: UpdateDashboardComponentInput[]) => {
    try {
      const response = await mutate({ variables: { input } })
      return response.data?.updateDashboardComponent
    } catch (err) {
      console.error('UpdateDashboardComponent Error:', err)
      throw err
    }
  }

  return {
    updateComponent,
    loading,
    error,
    data: data?.updateDashboardComponent
  }
}
