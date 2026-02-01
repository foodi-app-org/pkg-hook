import { gql, useMutation } from '@apollo/client'

/**
 * GraphQL mutation to delete a tag by ID or name.
 */
const DELETE_ONE_TAG = gql`
  mutation deleteOneTag($tgId: ID, $nameTag: String) {
    deleteOneTag(tgId: $tgId, nameTag: $nameTag) {
      success
      message
      data {
        tgId
        nameTag
        state
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
 * Custom hook to delete a tag by ID or name.
 * @returns {Object} An object with the deleteTag function and mutation state.
 */
// Type definitions for tag and mutation variables
type Tag = {
  tgId: string
  nameTag: string
  state: string
}

type DeleteTagVariables = {
  tgId?: string
  nameTag?: string
}

type DeleteTagResponse = {
  success: boolean
  message: string
  data: Tag | null
  errors: Array<{
    path: string
    message: string
    type: string
  }>
}

export const useDeleteOneTag = () => {
  const [deleteOneTag, { data, loading, error }] = useMutation<{ deleteOneTag: DeleteTagResponse }, DeleteTagVariables>(DELETE_ONE_TAG, {
    update(cache, { data }) {
      const deleted = data?.deleteOneTag?.data
      const success = data?.deleteOneTag?.success

      if (!success || !deleted?.tgId) return

      // Update cache for getAllTags
      cache.modify({
        fields: {
          getAllTags(existing = {}) {
            const filteredData = existing?.data?.filter(
              (tag: Tag) => tag.tgId !== deleted.tgId
            ) || []

            return {
              ...existing,
              data: filteredData,
              pagination: {
                ...existing.pagination,
                totalRecords: Math.max((existing.pagination?.totalRecords || 1) - 1, 0)
              }
            }
          }
        }
      })
    },
    // optional, remove if you prefer default behavior
    onError(err) {
      console.error('❌ Apollo error in deleteOneTag:', err)
    }
  })

  /**
   * Deletes a tag by ID or name.
   * @param root0
   * @param root0.tgId
   * @param root0.nameTag
   * @returns {Promise<DeleteTagResponse>} The response from the delete operation.
   */
  const handleDeleteTag = async ({
    tgId,
    nameTag
  }: DeleteTagVariables): Promise<DeleteTagResponse> => {
    try {
      const { data } = await deleteOneTag({
        variables: {
          tgId,
          nameTag
        }
      })

      return data!.deleteOneTag
    } catch (err: unknown) {
      let message = 'Unknown error'
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        message = err.message
      }
      return {
        success: false,
        message: 'An error occurred while deleting the tag.',
        data: null,
        errors: [
          {
            path: 'mutation',
            message,
            type: 'server'
          }
        ]
      }
    }
  }

  return [handleDeleteTag, {
    data,
    loading,
    error
  }] as const
}
