import { useMutation, gql, useApolloClient } from '@apollo/client'
import { GET_ALL_TAGS } from './useGetAllTags'

/**
 * GraphQL mutation to register multiple tags.
 */
const REGISTER_MULTIPLE_TAGS = gql`
  mutation registerMultipleTags($input: [String!]!) {
    registerMultipleTags(input: $input) {
      success
      message
      errors {
        path
        message
      }
      data {
        tgId
        nameTag
        idStore
        idUser
      }
    }
  }
`

/**
 * Response structure for tag registration errors.
 */
interface ITagError {
  path: string
  message: string
}

/**
 * Structure for a registered tag.
 */
interface ITag {
  tgId: string
  nameTag: string
  idStore: string
  idUser: string
}

/**
 * General GraphQL response for registering tags.
 */
interface IResponseTag {
  success: boolean
  message: string
  errors: ITagError[]
  data: ITag[]
}

/**
 * Options for the useRegisterMultipleTags hook.
 */
interface UseRegisterMultipleTagsOptions {
  callback?: (response: IResponseTag) => void
}

/**
 * Return type for the useRegisterMultipleTags hook.
 */
type UseRegisterMultipleTagsReturn = [
  (tags: string[]) => Promise<IResponseTag>,
  {
    loading: boolean
    error: any
    data: IResponseTag | null
  }
]

/**
 * Hook to register multiple tags via GraphQL mutation.
 *
 * @param {UseRegisterMultipleTagsOptions} [options] - Optional callback for post-mutation handling.
 * @returns {UseRegisterMultipleTagsReturn} - Mutation handler and state.
 */
export const useRegisterMultipleTags = (
  { callback = () => { } }: UseRegisterMultipleTagsOptions = {}
): UseRegisterMultipleTagsReturn => {
  const client = useApolloClient()
  const [registerMultipleTags, { loading, error, data }] = useMutation<
    { registerMultipleTags: IResponseTag },
    { input: string[] }
  >(REGISTER_MULTIPLE_TAGS, {
    onCompleted: (data) => {
      if (typeof callback === 'function') {
        callback(data.registerMultipleTags)
      }
    }
  })

  /**
   * Register multiple tags with the provided names.
   *
   * @param {string[]} tags - Array of tag names.
   * @returns {Promise<IResponseTag>} - Mutation response.
   */
  const handleRegisterTags = async (tags: string[]): Promise<IResponseTag> => {
    if (!Array.isArray(tags) || tags.length === 0 || tags.some(tag => typeof tag !== 'string')) {
      throw new Error('Tag list must be a non-empty array of strings.')
    }

    const response = await registerMultipleTags({
      variables: {
        input: tags
      },
       update: (cache, { data }) => {
      if (!data?.registerMultipleTags?.data?.length) return;

      const newTags = data.registerMultipleTags.data;

      try {
        const existing = client.readQuery({ query: GET_ALL_TAGS });

        const updatedTags = [
          ...newTags,
          ...(existing?.getAllTags?.data || [])
        ];

        cache.writeQuery({
          query: GET_ALL_TAGS,
          data: {
            getAllTags: {
              ...existing.getAllTags,
              data: updatedTags,
              pagination: {
                ...existing.getAllTags.pagination,
                totalRecords: updatedTags.length,
              },
            }
          }
        });
      } catch (error) {
        console.warn('Failed to update cache for GET_ALL_TAGS:', error);
      }
    },
    })
    return response.data?.registerMultipleTags ?? {
      success: false,
      message: 'No response from server',
      errors: [],
      data: []
    }
  }

  return [
    handleRegisterTags,
    {
      loading,
      error,
      data: data?.registerMultipleTags ?? null
    }
  ]
}
