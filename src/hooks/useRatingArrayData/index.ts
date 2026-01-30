import { useQuery } from '@apollo/client'
import { useState, useEffect } from 'react'
 
import { GET_All_RATING_STORE } from './queries'

export const useRatingArrayData = () => {
  const { data: dataRating } = useQuery(GET_All_RATING_STORE)

  const calculateTotalRatings = (ratings = []) => {
    return ratings.reduce(
      (total, rating) => {return {
        rAppearance: total?.rAppearance + rating?.rAppearance,
        rTasty: total?.rTasty + rating?.rTasty,
        rGoodCondition: total?.rGoodCondition + rating?.rGoodCondition,
        rGoodTemperature: total?.rGoodTemperature + rating?.rGoodTemperature
      }},
      {
        rAppearance: 0,
        rTasty: 0,
        rGoodCondition: 0,
        rGoodTemperature: 0
      }
    )
  }

  const [totalRatings, setTotalRatings] = useState(
    calculateTotalRatings(dataRating?.getAllRating || [])
  )

  useEffect(() => {
    setTotalRatings(calculateTotalRatings(dataRating?.getAllRating || []))
  }, [dataRating])

  const dataArr = [
    {
      name: 'Buena apariencia',
      value: totalRatings.rAppearance || 0
    },
    {
      name: 'Es deliciosa',
      value: totalRatings.rTasty || 0
    },
    {
      name: 'Buenas condiciones',
      value: totalRatings.rGoodCondition || 0
    },
    {
      name: 'Buena temperatura',
      value: totalRatings.rGoodTemperature || 0
    }
  ]

  return dataArr
}
