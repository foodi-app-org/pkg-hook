import { useMutation } from "@apollo/client"
import { updateCacheMod } from "../../utils"
import { GET_EXTRAS_PRODUCT_FOOD_OPTIONAL, UPDATE_EXTRAS_PRODUCT_FOOD_OPTIONAL } from "../useProductsFood/queriesStore"


export const useUpdateExtProductFoodsOptional = () => {
  const [updateExtProductFoodsOptional] = useMutation(UPDATE_EXTRAS_PRODUCT_FOOD_OPTIONAL)

const handleUpdateExtProduct = async ({
  pId,
  code,
  OptionalProName,
  required,
  numbersOptionalOnly
}) => {
  await updateExtProductFoodsOptional({
  variables: {
    input: {
      pId,
      code,
      OptionalProName,
      required,
      numbersOptionalOnly
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
