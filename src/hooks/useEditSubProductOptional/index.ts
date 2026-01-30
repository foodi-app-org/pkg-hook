import { useMutation } from '@apollo/client'

import { EDIT_EXTRA_SUB_OPTIONAL_PRODUCTS } from './queries'

export const useEditSubProductOptional = () => {
  const [editExtFoodSubsOptional, {
    loading,
    error,
    called
  }] = useMutation(EDIT_EXTRA_SUB_OPTIONAL_PRODUCTS)
  return [editExtFoodSubsOptional, { loading, error, called }]
}
