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

type DashboardComponent = {
  id: string
  idStore: string
  idUser: string
  coordinates: string
}

type UseDashboardComponentsResult = {
  data: DashboardComponent[]
  loading: boolean
  error: any
  refetch: () => void
}

type UseDashboardComponentsProps = {
  callback?: (components: DashboardComponent[]) => void
}

export const useDashboardComponents = (
  { callback = (args: DashboardComponent[]) => {
    return args
  } }: UseDashboardComponentsProps
): UseDashboardComponentsResult => {
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
