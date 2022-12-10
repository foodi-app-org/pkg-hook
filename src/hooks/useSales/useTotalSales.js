import { useQuery } from '@apollo/client'
import { useState } from 'react'
import { GET_ALL_COUNT_SALES } from './queries'

export const useTotalSales = () => {
    const [count, setCount] = useState(0)
    const { loading, error } = useQuery(GET_ALL_COUNT_SALES, {
        onCompleted: (data) => {
            setCount(data?.getTodaySales || 0)
        },
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        nextFetchPolicy: 'cache-first',
        refetchWritePolicy: 'merge',
    })
    return [count, { loading, error }]
}
