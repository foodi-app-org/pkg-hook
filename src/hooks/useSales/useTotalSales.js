import { useApolloClient, useQuery } from '@apollo/client'
import { useState } from 'react'
import { GET_ALL_COUNT_SALES } from './queries'
export * from './queries'
export const useTotalSales = () => {
    const [count, setCount] = useState(0)
    const client = useApolloClient();

    const { loading, error } = useQuery(GET_ALL_COUNT_SALES, {
        onCompleted: (data) => {
            if (data) {
                client.writeQuery({ query: GET_ALL_COUNT_SALES, data }); // Almacena la respuesta en la cache
            }
            if (data?.getTodaySales) {
                setCount(data?.getTodaySales || 0)
            }
        },
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        nextFetchPolicy: 'cache-first',
        refetchWritePolicy: 'merge',
    })
    return [count, { loading, error }]
}
