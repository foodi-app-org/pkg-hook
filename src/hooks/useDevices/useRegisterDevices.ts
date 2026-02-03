import { useMutation, gql } from '@apollo/client'

/**
 * GraphQL mutation para registrar un nuevo dispositivo
 */
const REGISTER_DEVICE_USER = gql`
  mutation RegisterDeviceUser($input: DeviceUserInput!) {
    newRegisterDeviceUser(input: $input) {
      success
      message
      data {
        dId
        id
        deviceId
        deviceName
        locationFormat
        type
        shortName
        platform
        version
        dState
        createdAt
        dState
      }
      errors {
        path
        message
        type
        context {
          limit
          value
          label
          key
        }
      }
    }
  }
`

/**
 * Custom hook para la mutación RegisterDeviceUser
 * @returns {[handleRegisterDeviceUser, { loading: boolean, error: any, data: any }]} - Función para registrar el dispositivo y el estado de la operación
 */
type DeviceUserInput = {
  // Define the properties of DeviceUserInput according to your GraphQL schema
  // Example:
  // deviceId: string;
  // deviceName: string;
  // ...etc
  [key: string]: any;
};

type RegisterDeviceUserResult = {
  success: boolean;
  data?: any;
  errors?: Array<{ message: string }>;
};

export const useRegisterDeviceUser = (): [
  (input: DeviceUserInput) => Promise<RegisterDeviceUserResult>,
  { loading: boolean; error: any; data: any }
] => {
  const [registerDeviceUser, { loading, error, data }] = useMutation(REGISTER_DEVICE_USER);

  const handleRegisterDeviceUser = async (input: DeviceUserInput): Promise<RegisterDeviceUserResult> => {
    try {
      const result = await registerDeviceUser({ variables: { input } });

      if (result.data?.newRegisterDeviceUser?.success) {
        return { success: true, data: result.data.newRegisterDeviceUser.data };
      }
      return {
        success: false,
        errors: result.data?.newRegisterDeviceUser?.errors || []
      };

    } catch (err: unknown) {
      console.error('Error while registering device user:', err);
      if (err instanceof Error) {
        return { success: false, errors: [{ message: err.message }] };
      }
      return { success: false, errors: [{ message: 'Unknown error' }] };
    }
  };

  return [handleRegisterDeviceUser, {
    loading,
    error,
    data
  }];
};
