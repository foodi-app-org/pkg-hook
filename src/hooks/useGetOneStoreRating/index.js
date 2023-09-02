import { useState } from 'react'
import { useLazyQuery } from '@apollo/client'
import { GET_ONE_RATING_STORE } from './queries'

export const useGetOneStoreRating = () => {
  const [ratings, setRatings] = useState({
    rGoodTemperature: 0,
    rGoodCondition: 0,
    rTasty: 0,
    appearance: 0
  })

  const [getOneRating] = useLazyQuery(GET_ONE_RATING_STORE, {
    onCompleted: res => {
      if (res) {
        setRatings((prevState) => {
          return {
            ...prevState,
            rGoodTemperature: res.getOneRating.rGoodTemperature || 0,
            rGoodCondition: res.getOneRating.rGoodCondition || 0,
            rTasty: res.getOneRating.rTasty || 0,
            appearance: res.getOneRating.rAppearance || 0
          }
        })
      }
    }
  })

  return {
    ratings,
    setRatings,
    getOneRating
  }
}
