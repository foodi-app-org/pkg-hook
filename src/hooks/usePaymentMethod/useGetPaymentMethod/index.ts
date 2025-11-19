'use client'

import { useQuery } from '@apollo/client'
import { GET_PAYMENT_METHOD } from '../paymentMethod.gql'
import { PaymentMethod } from '../paymentMethod.types'

interface Props {
  payId: string
}

export const useGetPaymentMethod = ({ payId }: Props) => {
  const { data, loading, error } = useQuery<{ getPaymentMethod: PaymentMethod }>(
    GET_PAYMENT_METHOD,
    {
      variables: { payId },
      skip: !payId
    }
  )

  return {
    paymentMethod: data?.getPaymentMethod,
    loading,
    error
  }
}
