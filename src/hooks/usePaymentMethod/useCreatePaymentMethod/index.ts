'use client'

import { useMutation } from '@apollo/client'

import { CREATE_PAYMENT_METHOD, GET_ALL_PAYMENT_METHODS } from '../paymentMethod.gql'
import { CreatePaymentMethodInput, PaymentMethod } from '../paymentMethod.types'


export const useCreatePaymentMethod = () => {
  const [createPaymentMethod, { loading, error }] = useMutation<
        { createPaymentMethod: PaymentMethod },
        { input: CreatePaymentMethodInput }
    >(CREATE_PAYMENT_METHOD, {
      refetchQueries: [{ query: GET_ALL_PAYMENT_METHODS }]
    })

  const handleCreate = async (input: CreatePaymentMethodInput) => {
    const res = await createPaymentMethod({ variables: { input } })
    return res.data?.createPaymentMethod
  }
  return [handleCreate, {
    loading,
    error
  }]
}
