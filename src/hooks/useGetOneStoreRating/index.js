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
          const {
            rGoodTemperature,
            rGoodCondition,
            rTasty,
            rAppearance
          } = res.getOneRating || {}
          return {
            ...prevState,
            rGoodTemperature: rGoodTemperature || 0,
            rGoodCondition: rGoodCondition || 0,
            rTasty: rTasty || 0,
            appearance: rAppearance || 0
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
