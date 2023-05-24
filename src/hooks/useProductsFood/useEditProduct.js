import { useMutation } from '@apollo/client'
import React from 'react'
import { EDIT_PRODUCT } from './queriesStore'

export const useEditProduct = () => {
    const [editProductFoods, { loading, error }] = useMutation(EDIT_PRODUCT)

  return [editProductFoods, {  loading: loading, error: error }]
}

