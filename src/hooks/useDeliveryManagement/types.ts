import type { DeliveryMethod, DeliveryMode } from '../useDeliveryCheckout/types'
export type { DeliveryMode }
export type DeliveryParty = 'NONE' | 'MERCHANT' | 'PROVIDER'
export interface ManagedDeliveryMethod extends DeliveryMethod {
  idStore: string
  collector: DeliveryParty
  beneficiary: DeliveryParty
  defaultFeeMinor: string | null
  createdAt: string
  updatedAt: string
}
export interface CreateDeliveryMethodInput {
  code: string
  name: string
  mode: DeliveryMode
  defaultFee: string | null
  allowFeeOverride: boolean
  active: boolean
}
export type UpdateDeliveryMethodInput = Partial<Pick<CreateDeliveryMethodInput, 'name' | 'defaultFee' | 'allowFeeOverride' | 'active'>>
export interface UpdateDeliveryMethodVariables { id: string; expectedRevision: number; input: UpdateDeliveryMethodInput }
export type DeliveryMethodDraft = Omit<CreateDeliveryMethodInput,'defaultFee'> & { defaultFee: string; variableFee: boolean }
