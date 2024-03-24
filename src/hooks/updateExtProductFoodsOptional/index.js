import { useMutation } from '@apollo/client'
import { updateCacheMod } from '../../utils'
import { GET_EXTRAS_PRODUCT_FOOD_OPTIONAL, UPDATE_EXTRAS_PRODUCT_FOOD_OPTIONAL } from '../useProductsFood/queriesStore'

export const useUpdateExtProductFoodsOptional = () => {
  const [updateExtProductFoodsOptional] = useMutation(UPDATE_EXTRAS_PRODUCT_FOOD_OPTIONAL)

  const handleUpdateExtProduct = async ({
    pId,
    code,
    opExPid,
    OptionalProName,
    required,
    numbersOptionalOnly
  }) => {
    return await updateExtProductFoodsOptional({
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
    handleUpdateExtProduct
  }
}
