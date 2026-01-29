import { useMutation } from '@apollo/client'
import { updateCacheMod } from '../../utils'
import { GET_EXTRAS_PRODUCT_FOOD_OPTIONAL, UPDATE_EXTRAS_PRODUCT_FOOD_OPTIONAL } from '../useProductsFood/queriesStore'

export const useUpdateExtProductFoodsOptional = () => {
  const [updateExtProductOptional] = useMutation(UPDATE_EXTRAS_PRODUCT_FOOD_OPTIONAL)

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
    required?: boolean
    numbersOptionalOnly?: number | string
  }) => {
    return await updateExtProductOptional({
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
      update: (cache, { data: { ExtProductFoodsOptionalAll } }) => {
        updateCacheMod({
          cache,
          query: GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
          nameFun: 'ExtProductFoodsOptionalAll',
          dataNew: ExtProductFoodsOptionalAll,
          type: 1
        })
      }
    })
  }
  return {
    handleUpdateExtProduct
  }
}
