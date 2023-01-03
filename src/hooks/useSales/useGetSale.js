import { useLazyQuery } from '@apollo/client'
import { GET_ONE_SALE } from './queries'
export const useGetSale = () => {

    const [getOnePedidoStore, {data, loading}] = useLazyQuery(GET_ONE_SALE)
    console.log(data)
    return {
        data: data?.getOnePedidoStore || {},
        loading,
        getOnePedidoStore
    }
}

