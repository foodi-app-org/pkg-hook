export interface PaymentMethod {
  payId: string
  name: string
  icon: string
  state: string
  paymentPriority: number
  createdAt?: string
  updatedAt?: string
}

export interface CreatePaymentMethodInput {
  payId: string
  name: string
  icon: string
  state: string
  paymentPriority: number
  mIcon?: number
  mState?: number
}

export interface UpdatePaymentMethodInput {
  name?: string
  icon?: string
  state?: string
  paymentPriority?: number
  mIcon?: number
  mState?: number
}
