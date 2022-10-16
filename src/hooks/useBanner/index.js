import { useQuery } from '@apollo/client'
import { GET_ONE_BANNER_STORE } from '../useProductsFood/queriesStore'
import { useStore } from '../useStore'

export const useBanner = () => {
  const [store, { loading: loaStore }] = useStore()

    const {
      data,
      loading,
      error
      } = useQuery(GET_ONE_BANNER_STORE, {
        context: { clientName: 'admin-server' },
        variables: {
          idStore: !loaStore && store.store
        }
      })
    return [data?.getOneBanners, { loading, error }]
}
