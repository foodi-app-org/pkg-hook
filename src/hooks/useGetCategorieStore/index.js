import { useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'
import { GET_ONE_STORE_IN_CATEGORY } from './queries'

export const useGetCategorieStore = ({ catStoreId }) => {

  const { data: dataCatSto, loading, error } = useQuery(GET_ONE_STORE_IN_CATEGORY, {
    variables: {
      catStore: catStoreId
    },
    onError: () => {
      console.log({ message: '', duration: 5000 })

    }
  })
  const [categories, setCategorieStore] = useState([])
  useEffect(() => {
    setCategorieStore(dataCatSto?.getOneCatStore || [])
  }, [dataCatSto])
  return [categories, { loading, error }]
}