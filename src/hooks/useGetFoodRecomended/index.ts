import { useQuery } from '@apollo/client'
import { GET_ALL_PRODUCT_STORE_RECOMENDED } from './queries'

export const useGetFoodRecomended = ({
  name = ''
}) => {
  const {
    data,
    called,
    fetchMore,
    loading,
    error
  } = useQuery(GET_ALL_PRODUCT_STORE_RECOMENDED, {
    fetchPolicy: 'cache-and-network',
    skip: !name,
    notifyOnNetworkStatusChange: true,
    nextFetchPolicy: 'cache-first',
    refetchWritePolicy: 'merge',
    variables:
        {
          max: 6,
          search: name
        }
  })

  return [data?.productFoodsAllRecommended, {
    called,
    fetchMore,
    loading,
    error
  }]
}
