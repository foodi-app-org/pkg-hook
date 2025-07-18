import { useQuery, gql } from '@apollo/client'

/**
 * GraphQL query to fetch all tags
 */
export const GET_ALL_TAGS = gql`
  query getAllTags {
    getAllTags {
      success
      message
      pagination {
        totalRecords
        totalPages
        currentPage
      }
      data {
        tgId
        idUser
        idStore
        pId
        nameTag
        aName
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
 * Custom hook to fetch all tags
 *
 * @returns {{
 *  tags: any[],
 *  loading: boolean,
 *  error: Error | null,
 *  message: string,
 *  success: boolean,
 *  pagination: { totalRecords: number, totalPages: number, currentPage: number } | null,
 *  errors: any[] | null
 * }}
 */
export const useGetAllTags = () => {
  const { data, loading, error } = useQuery(GET_ALL_TAGS, {
    fetchPolicy: 'network-only',
  })

  const result = data?.getAllTags ?? {}

  return {
    tags: result?.data || [],
    loading,
    error,
    message: result?.message ?? '',
    success: result?.success ?? false,
    pagination: result?.pagination ?? null,
    errors: result?.errors ?? null,
  }
}
