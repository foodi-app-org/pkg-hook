import { gql, useLazyQuery, ApolloError } from '@apollo/client'
import {
  GetExtrasProductFoodOptionalResponse,
  GetExtrasProductFoodOptionalVars,
  ExtProductFoodOptional
} from './types'

import { GET_EXTRAS_PRODUCT_FOOD_OPTIONAL } from '../useProductsFood/queriesStore'

interface UseGetExtProductFoodsSubOptionalAllParams {
  setDataOptional?: (data: ExtProductFoodOptional[]) => void
}

export const useGetExtProductFoodsSubOptionalAll = (
  { setDataOptional = () => {} }: UseGetExtProductFoodsSubOptionalAllParams = {}
): [
  (options?: { variables?: GetExtrasProductFoodOptionalVars }) => void,
  {
    data?: GetExtrasProductFoodOptionalResponse
    loading: boolean
    error?: ApolloError
  }
] => {
  const [getExtras, { data, loading, error }] = useLazyQuery<
    GetExtrasProductFoodOptionalResponse,
    GetExtrasProductFoodOptionalVars
  >(GET_EXTRAS_PRODUCT_FOOD_OPTIONAL, {
    onError: () => {
      setDataOptional([])
    }
  })

  return [getExtras, { data, loading, error }]
}
