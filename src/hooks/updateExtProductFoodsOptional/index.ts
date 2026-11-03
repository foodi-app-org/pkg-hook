import { useMutation } from '@apollo/client'

import { updateCacheMod } from '../../utils'
import {
  GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
  UPDATE_EXTRAS_PRODUCT_FOOD_OPTIONAL
} from '../useProductsFood/queriesStore'

interface UpdateExtProductFoodsOptionalProps {
  sendNotification?: (notification: {
    description: string
    title: string
    backgroundColor: 'success' | 'error'
  }) => void
}

export const useUpdateExtProductFoodsOptional = ({
  sendNotification
}: UpdateExtProductFoodsOptionalProps = {}) => {
  const [updateExtProductOptional] = useMutation(
    UPDATE_EXTRAS_PRODUCT_FOOD_OPTIONAL
  )

  const handleUpdateExtProduct = async ({
    pId,
    code,
    opExPid,
    OptionalProName,
    required,
    numbersOptionalOnly
  }: {
    pId: string
    code: string
    opExPid: string
    OptionalProName?: string
    required?: boolean | number
    numbersOptionalOnly?: number | string
  }) => {
    try {
      const { data } = await updateExtProductOptional({
        variables: {
          input: {
            pId,
            code,
            opExPid,
            OptionalProName,
            required,
            numbersOptionalOnly: Number(numbersOptionalOnly)
          }
        },
        update: (cache, { data }) => {
          const ExtProductFoodsOptionalAll =
            data?.ExtProductFoodsOptionalAll

          if (!ExtProductFoodsOptionalAll) return

          updateCacheMod({
            cache,
            query: GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
            nameFun: 'ExtProductFoodsOptionalAll',
            dataNew: ExtProductFoodsOptionalAll,
            type: 1
          })
        }
      })

      const response = data?.updateExtProductOptional

      if (response?.success) {
        sendNotification?.({
          description: 'El sub item actualizado con éxito',
          title: response?.message ?? '',
          backgroundColor: 'success'
        })
      }

      return data
    } catch (error) {
      sendNotification?.({
        description: 'No fue posible actualizar el sub item',
        title: 'Error al actualizar',
        backgroundColor: 'error'
      })

      throw error
    }
  }

  return {
    handleUpdateExtProduct
  }
}