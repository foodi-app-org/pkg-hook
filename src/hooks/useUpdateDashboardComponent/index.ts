import { gql, useMutation } from '@apollo/client';

/**
 * GraphQL mutation for updating a dashboard component.
 */
const UPDATE_DASHBOARD_COMPONENT = gql`
  mutation UpdateDashboardComponent($input: DashboardComponentUpdateInput!) {
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
`;

/**
 * Types for the mutation response and input.
 */
interface DashboardComponent {
  id: string;
  idStore: string;
  idUser: string;
  coordinates: any;
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
  coordinates?: any;
  title?: string;
}

/**
 * Custom hook to update a dashboard component.
 */
export const useUpdateDashboardComponent = () => {
  const [mutate, { loading, error, data }] = useMutation<
    UpdateDashboardComponentResponse,
    { input: UpdateDashboardComponentInput }
  >(UPDATE_DASHBOARD_COMPONENT);

  /**
   * Calls the mutation with the provided input.
   * @param input DashboardComponentUpdateInput
   */
  const updateComponent = async (input: UpdateDashboardComponentInput) => {
    try {
      const response = await mutate({ variables: { input } });
      return response.data?.updateDashboardComponent;
    } catch (err) {
      console.error('UpdateDashboardComponent Error:', err);
      throw err;
    }
  };

  return {
    updateComponent,
    loading,
    error,
    data: data?.updateDashboardComponent,
  };
};
