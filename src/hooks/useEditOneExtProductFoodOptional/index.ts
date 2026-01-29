import { useState } from 'react'

import { useMutation } from '@apollo/client'
import { UPDATE_EXT_PRODUCT_FOOD_OPTIONAL } from './queries'
export const useEditOneExtProductFoodOptional = () => {
  const [updateExtProductFood] = useMutation(UPDATE_EXT_PRODUCT_FOOD_OPTIONAL)
  const [loading, setLoading] = useState(false)

  const updateOneExtraProductFood = async (input) => {
    setLoading(true)

    try {
      const { data } = await updateExtProductFood({
        variables: { input }
      })
      console.log('Product food updated:', data.editExtProductFoodOptional)
      setLoading(false)
    } catch (error) {
      console.error('Error updating product food:', error.message)
      setLoading(false)
      throw new Error('Error updating product food')
    }
  }
  return {
    loading,
    updateOneExtraProductFood
  }
}
