import { useMutation } from '@apollo/client'
import { updateCacheMod } from '../../utils'
import { GET_EXTRAS_PRODUCT_FOOD_OPTIONAL, GET_EXTRAS_PRODUCT_FOOD_SUB_OPTIONAL } from '../useProductsFood/queriesStore'

export const useUpdateExtProductFoodsSubOptional = ({
  sendNotification = (args) => { return args }
} = {}) => {
  const [updateExtProductSubOptional] = useMutation(GET_EXTRAS_PRODUCT_FOOD_SUB_OPTIONAL, {
    onCompleted: (data) => {
      console.log('🚀 ~ useUpdateExtProductFoodsSubOptional ~ data:', data)
      const { updateExtProductSubOptional } = data ?? {}
      const { success, message, errors } = updateExtProductSubOptional ?? {}
      sendNotification({
        description: message,
        title: success ? 'Sub item creado' : 'Error',
        backgroundColor: success ? 'success' : 'error'
      })
      for (const err of errors || []) {
        const { message: msg } = err || {}
        sendNotification({
          description: msg,
          title: 'Error',
          backgroundColor: 'error'
        })
      }
      return data
    }
  })

  const handleMutateExtProductFoodsSubOptional = ({
    pId,
    title,
    listId,
    id,
    state = 1
  }) => {
    updateExtProductSubOptional({
      variables: {
        input: {
          pId,
          OptionalSubProName: title,
          exCodeOptionExtra: listId,
          exCode: id,
          state
        }
      },
      update: (cache, { data: { ExtProductFoodsOptionalAll } }) => {
        return updateCacheMod({
          cache,
          query: GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
          nameFun: 'ExtProductFoodsOptionalAll',
          dataNew: ExtProductFoodsOptionalAll
        })
      }
    })
  }
  return {
    handleMutateExtProductFoodsSubOptional
  }
}
