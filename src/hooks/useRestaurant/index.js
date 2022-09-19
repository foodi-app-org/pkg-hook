import { useQuery } from '@apollo/client'
import { GET_ALL_RESTAURANT } from './queries'

export const useRestaurant = () => {
    const {
        data,
        loading,
        error,
        fetchMore
        } = useQuery(GET_ALL_RESTAURANT, {
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        nextFetchPolicy: 'cache-first',
        refetchWritePolicy: 'merge',
        context: { clientName: 'admin-store'
    }
    })
    return [data, { loading, error, fetchMore }]
}
