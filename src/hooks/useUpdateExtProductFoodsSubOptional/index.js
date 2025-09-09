import { useMutation } from '@apollo/client'
import { updateCacheMod } from '../../utils'
import { GET_EXTRAS_PRODUCT_FOOD_OPTIONAL, GET_EXTRAS_PRODUCT_FOOD_SUB_OPTIONAL } from '../useProductsFood/queriesStore'

export const useUpdateExtProductFoodsSubOptional = ({
  sendNotification = () => { }
} = {}) => {
  const [updateExtProductSubOptional] = useMutation(GET_EXTRAS_PRODUCT_FOOD_SUB_OPTIONAL, {
    onCompleted: (data) => {
      const { updateExtProductSubOptional } = data
      const {
        success,
        errors,
        message
      } = updateExtProductSubOptional ?? {
        success: false,
        message: 'Error inesperado'
      }
      if (errors?.length) {
        errors.forEach(({ message: msg }) => {
          sendNotification({
            description: msg,
            title: 'Error',
            backgroundColor: 'error'
          })
        })
        return
      }
      if (!success) {
        sendNotification({
          description: message,
          title: 'Error',
          backgroundColor: 'error'
        })
        return
      }
      sendNotification({
        description: message,
        title: 'Actualizado',
        backgroundColor: 'success'
      })
    }
  })

  const handleMutateExtProductFoodsSubOptional = async ({
    pId,
    title,
    listId,
    id,
    state = 1
  }) => {
    return updateExtProductSubOptional({
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
