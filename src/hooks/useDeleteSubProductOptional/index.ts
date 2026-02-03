import { useMutation } from '@apollo/client'
import { AlertBoxType, type SetAlertBoxFn } from 'typesdefs'

import { updateCacheMod } from '../../utils'
import { GET_EXTRAS_PRODUCT_FOOD_OPTIONAL } from '../useRemoveExtraProductFoodsOptional/queries'

import { DELETE_CAT_EXTRA_SUB_OPTIONAL_PRODUCTS } from './queries'

interface UseDeleteSubProductOptionalProps {
  setAlertBox?: SetAlertBoxFn
}
interface RemoveSubProductOptionalParams {
  state: number
  opSubExPid: string
}

export const useDeleteSubProductOptional = ({ setAlertBox = () => { } } : UseDeleteSubProductOptionalProps = {}) => {
  const [DeleteExtFoodSubsOptional, {
    loading,
    error,
    called
  }] = useMutation(DELETE_CAT_EXTRA_SUB_OPTIONAL_PRODUCTS)

  const handleRemoveSubProductOptional = ({ state, opSubExPid }: RemoveSubProductOptionalParams) => {
    DeleteExtFoodSubsOptional({
      variables: {
        state,
        opSubExPid
      },
      update: (cache, { data }) => {
        if (data && data.ExtProductFoodsOptionalAll) {
          updateCacheMod({
            cache,
            query: GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
            nameFun: 'ExtProductFoodsOptionalAll',
            dataNew: data.ExtProductFoodsOptionalAll,
            type: 3 // Set the correct type value as required by your logic
          })
        }
      }
    }).then(res => {
      return setAlertBox({
        message: res?.data?.DeleteExtFoodSubsOptional?.message,
        type: AlertBoxType.SUCCESS // or 'error', 'info', etc. depending on your AlertBoxType definition
      })
    })
  }
  return [DeleteExtFoodSubsOptional, handleRemoveSubProductOptional, { loading, error, called }]
}
