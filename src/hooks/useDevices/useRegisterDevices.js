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
        short_name
        platform
        version
        dState
        DatCre
        DatMod
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
 * @returns {Object} - Función para registrar el dispositivo y el estado de la operación
 */
export const useRegisterDeviceUser = () => {
  const [registerDeviceUser, { loading, error, data }] = useMutation(REGISTER_DEVICE_USER)

  /**
   * Función para manejar la mutación
   * @param {Object} input - Datos del dispositivo a registrar
   * @returns {Promise<Object>} - Resultado de la operación
   */
  const handleRegisterDeviceUser = async (input) => {
    try {
      const result = await registerDeviceUser({ variables: { input } })

      if (result.data?.newRegisterDeviceUser?.success) {
        return { success: true, data: result.data.newRegisterDeviceUser.data }
      } else {
        return {
          success: false,
          errors: result.data?.newRegisterDeviceUser?.errors || []
        }
      }
    } catch (err) {
      console.error('Error while registering device user:', err)
      return { success: false, errors: [{ message: err.message }] }
    }
  }

  return [handleRegisterDeviceUser, {
    loading,
    error,
    data
  }]
}
