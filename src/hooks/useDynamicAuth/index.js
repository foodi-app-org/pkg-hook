import { useQuery } from '@apollo/client'
import { useState } from 'react'
import { GET_ONE_DYNAMIC_PASS } from './queries'

export const useDynamicAuth = () => {
  const [dynamicPass, setDynamicPass] = useState({})
  const { loading, error } = useQuery(GET_ONE_DYNAMIC_PASS, {
    onCompleted: (res) => {
      setDynamicPass(res.getAOneDynamicPassword)
    }
  })
  return [dynamicPass, { loading, error }]
}