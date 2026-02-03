import { useLazyQuery, ApolloError } from '@apollo/client'

import { GET_EXTRAS_PRODUCT_FOOD_OPTIONAL } from '../useProductsFood/queriesStore'

import {
  GetExtrasProductFoodOptionalResponse,
  GetExtrasProductFoodOptionalVars,
  ExtProductFoodOptional
} from './types'


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
