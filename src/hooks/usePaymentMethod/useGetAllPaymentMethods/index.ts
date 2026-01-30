'use client'

import { useQuery } from '@apollo/client'

import { GET_ALL_PAYMENT_METHODS } from '../paymentMethod.gql'
import { PaymentMethod } from '../paymentMethod.types'

export const useGetAllPaymentMethods = () => {
  const { data, loading, error, refetch } = useQuery<{
    getAllPaymentMethods: PaymentMethod[]
  }>(GET_ALL_PAYMENT_METHODS)

  return {
    data: data?.getAllPaymentMethods ?? [],
    loading,
    error,
    refetch
  }
}
