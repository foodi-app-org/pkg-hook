import { useLazyQuery } from '@apollo/client'

import { GET_EXTRAS_PRODUCT_FOOD_OPTIONAL } from '../useProductsFood/queriesStore'

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
