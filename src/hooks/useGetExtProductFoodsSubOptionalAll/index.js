import { GET_EXTRAS_PRODUCT_FOOD_OPTIONAL } from '../useProductsFood/queriesStore'
import { useLazyQuery } from '@apollo/client'

export const useGetExtProductFoodsSubOptionalAll = ({ setDataOptional = () => { } } = {}) => {
  const [ExtProductFoodsSubOptionalAll] = useLazyQuery(
    GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
    {
      onError: () => {
        setDataOptional([])
      }
    }
  )
  return [ExtProductFoodsSubOptionalAll]
}
