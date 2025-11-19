import { gql } from '@apollo/client'

export const GET_PAYMENT_METHOD = gql`
  query getPaymentMethod($payId: ID!) {
    getPaymentMethod(payId: $payId) {
      payId
      name
      icon
      state
      paymentPriority
      createdAt
      updatedAt
    }
  }
`

export const GET_ALL_PAYMENT_METHODS = gql`
  query getAllPaymentMethods {
    getAllPaymentMethods {
      payId
      name
      icon
      state
      paymentPriority
      createdAt
      updatedAt
    }
  }
`

export const CREATE_PAYMENT_METHOD = gql`
  mutation createPaymentMethod($input: CreatePaymentMethodInput!) {
    createPaymentMethod(input: $input) {
      payId
      name
      icon
      state
      paymentPriority
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_PAYMENT_METHOD = gql`
  mutation updatePaymentMethod($payId: ID!, $input: UpdatePaymentMethodInput!) {
    updatePaymentMethod(payId: $payId, input: $input) {
      payId
      name
      icon
      state
      paymentPriority
      updatedAt
    }
  }
`

export const DELETE_PAYMENT_METHOD = gql`
  mutation deletePaymentMethod($payId: ID!) {
    deletePaymentMethod(payId: $payId)
  }
`
