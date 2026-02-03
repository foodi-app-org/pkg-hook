import { useQuery } from '@apollo/client'

import { GET_ALL_SHOPPING_CARD } from '../queries'
interface UseGetCartProps {
  setAlertBox?: ({ message }: { message: string }) => { message: string }
  setCountItemProduct?: (number: number) => number
}
export const useGetCart = ({
  setAlertBox = ({
    message
  }: { message: string }) => { return { message } },
  setCountItemProduct = (number: number) => { return number }
}: UseGetCartProps = {}) => {
  const {
    data,
    loading,
    error,
    called
  } = useQuery(GET_ALL_SHOPPING_CARD, {
    onCompleted: data => {
      if (Array.isArray(data?.getAllShoppingCard) && Number(data?.getAllShoppingCard?.length)) {
        setCountItemProduct(data?.getAllShoppingCard?.length)
      }
    },
    fetchPolicy: 'cache-and-network',
    onError: () => {
      setAlertBox({ message: 'No pudimos cargar el carrito...' })
    }
  })
  const cart = data?.getAllShoppingCard || []
  return [cart, {
    data,
    called,
    loading,
    error
  }]
}
