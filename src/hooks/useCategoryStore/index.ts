import { useQuery } from '@apollo/client'
import { GET_ALL_CAT_STORE } from './queries'

export const useCategoryStore = () => {
  const { data, loading } = useQuery(GET_ALL_CAT_STORE)
  return [data, { loading }]
}
