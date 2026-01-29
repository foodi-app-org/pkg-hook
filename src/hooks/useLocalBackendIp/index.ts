import { useQuery, gql } from '@apollo/client'

/**
 * GraphQL query to get the local IP of the backend server.
 */
const GET_LOCAL_BACKEND_IP = gql`
  query GetLocalBackendIp {
    getLocalBackendIp
  }
`

/**
 * Custom hook to fetch the local IP address of the backend server.
 *
 * @returns {Object} - Contains the IP string, loading state, and error.
 */
export const useLocalBackendIp = () => {
  const {
    data,
    loading,
    error
  } = useQuery(GET_LOCAL_BACKEND_IP)
  const port = process.env.URL_ADMIN_SERVER?.split(':')?.[2]
  const buildUrlBackend = data?.getLocalBackendIp
    ? `http://${data.getLocalBackendIp}:${port}`
    : null

  return {
    urlBackend: buildUrlBackend,
    ip: data?.getLocalBackendIp || null,
    loading,
    error
  }
}
