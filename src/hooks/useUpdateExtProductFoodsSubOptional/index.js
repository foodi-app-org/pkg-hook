import { useMutation } from '@apollo/client'
import { updateCacheMod } from '../../utils'
import { GET_EXTRAS_PRODUCT_FOOD_OPTIONAL, GET_EXTRAS_PRODUCT_FOOD_SUB_OPTIONAL } from '../useProductsFood/queriesStore'

export const useUpdateExtProductFoodsSubOptional = () => {
    const [updateExtProductFoodsSubOptional] = useMutation(GET_EXTRAS_PRODUCT_FOOD_SUB_OPTIONAL)

    const handleMutateExtProductFoodsSubOptional = ({
        pId,
        title,
        listId,
        id,
        state = 1,
    }) => {
        updateExtProductFoodsSubOptional({
            variables: {
              input: {
                pId,
                OptionalSubProName: title,
                exCodeOptionExtra: listId,
                exCode: id,
                state
              }
            }, update: (cache, { data: { ExtProductFoodsOptionalAll } }) => {
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
