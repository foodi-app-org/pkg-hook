import { useMutation } from '@apollo/client'
import { useState } from 'react'

import { UPDATE_EXT_PRODUCT_FOOD_OPTIONAL } from './queries'
export const useEditOneExtProductFoodOptional = () => {
  const [updateExtProductFood] = useMutation(UPDATE_EXT_PRODUCT_FOOD_OPTIONAL)
  const [loading, setLoading] = useState(false)

  const updateOneExtraProductFood = async (input: any) => {
    setLoading(true)

    try {
      await updateExtProductFood({
        variables: { input }
      })
      setLoading(false)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error('Error updating product food')
      }
      setLoading(false)
    }
  }
  return {
    loading,
    updateOneExtraProductFood
  }
}
