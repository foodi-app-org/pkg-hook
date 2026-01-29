import { useMutation } from '@apollo/client'
import { DELETE_CAT_EXTRA_PRODUCTS } from './queries'

export const useRemoveExtraProductFoodsOptional = () => {
  const [DeleteExtProductFoodsOptional, { loading, error }] = useMutation(DELETE_CAT_EXTRA_PRODUCTS)

  const handleDeleteOptional = async elem => {
    const { state, opExPid } = elem || {}
    DeleteExtProductFoodsOptional({
      variables: {
        state,
        opExPid,
        isCustomOpExPid: true
      }
    })
  }
  return {
    handleDeleteOptional,
    DeleteExtProductFoodsOptional,
    loading,
    error
  }
}
