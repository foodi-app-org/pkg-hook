import { useQuery, gql } from '@apollo/client'

/**
 * GraphQL query to fetch dashboard components
 */
const GET_DASHBOARD_COMPONENTS = gql`
  query dashboardComponents {
    dashboardComponents {
      id
      idStore
      idUser
      coordinates
    }
  }
`

/**
 * Custom hook to fetch dashboard components
 * @returns {{
 *   data: Array,
 *   loading: boolean,
 *   error: any,
 *   refetch: () => void
 * }}
 */

export const useDashboardComponents = ({ callback = () => {} }) => {
  const {
    data,
    loading,
    error,
    refetch
  } = useQuery(GET_DASHBOARD_COMPONENTS, {
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      if (Array.isArray(data?.dashboardComponents)) {
        try {
          callback(data.dashboardComponents ?? [])
        } catch (err) {
          console.error('Error executing callback:', err)
        }
      }
    },
    onError: (err) => {
      console.error('Error fetching dashboard components:', err)
    }
  })

  return { data: data?.dashboardComponents ?? [], loading, error, refetch }
}
