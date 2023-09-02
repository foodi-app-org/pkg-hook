import { useMutation } from '@apollo/client'
import { DELETE_CAT_EXTRA_SUB_OPTIONAL_PRODUCTS } from './queries'
import { updateCacheMod } from '../../utils'
import { GET_EXTRAS_PRODUCT_FOOD_OPTIONAL } from '../useRemoveExtraProductFoodsOptional/queries'

export const useDeleteSubProductOptional = ({ setAlertBox = () => { } } = {}) => {
  const [DeleteExtFoodSubsOptional, {
    loading,
    error,
    called
  }] = useMutation(DELETE_CAT_EXTRA_SUB_OPTIONAL_PRODUCTS)

  const handleRemoveSubProductOptional = ({ state, opSubExPid }) => {
    console.log(state, opSubExPid)
    DeleteExtFoodSubsOptional({
      variables: {
        state,
        opSubExPid
      },
      update: (cache, { data: { ExtProductFoodsOptionalAll } }) => {
        return updateCacheMod({
          cache,
          query: GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
          nameFun: 'ExtProductFoodsOptionalAll',
          dataNew: ExtProductFoodsOptionalAll
        })
      }
    }).then(res => { return setAlertBox({ message: res?.message?.DeleteExtFoodSubsOptional?.message }) })
  }
  return [DeleteExtFoodSubsOptional, handleRemoveSubProductOptional, { loading, error, called }]
}
