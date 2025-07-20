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
export const useDeleteOneTag = () => {
    const [deleteOneTag, { data, loading, error }] = useMutation(DELETE_ONE_TAG, {
        update(cache, { data }) {
            const deleted = data?.deleteOneTag?.data
            const success = data?.deleteOneTag?.success

            if (!success || !deleted?.tgId) return

            // Update cache for getAllTags
            cache.modify({
                fields: {
                    getAllTags(existing = {}) {
                        const filteredData = existing?.data?.filter(
                            (tag: any) => tag.tgId !== deleted.tgId
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
     * @param {Object} variables - Mutation input.
     * @param {string} [variables.tgId] - Tag ID (optional).
     * @param {string} [variables.nameTag] - Tag name (optional).
     * @returns {Promise<Object>} Response from server.
     */
    const handleDeleteTag = async ({
        tgId,
        nameTag
    }: {
        tgId?: string
        nameTag?: string
    }) => {
        try {
            const { data } = await deleteOneTag({
                variables: {
                    tgId,
                    nameTag
                }
            })

            return data.deleteOneTag
        } catch (err: any) {
            return {
                success: false,
                message: 'An error occurred while deleting the tag.',
                data: null,
                errors: [
                    {
                        path: 'mutation',
                        message: err.message || 'Unknown error',
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
    }]
}
