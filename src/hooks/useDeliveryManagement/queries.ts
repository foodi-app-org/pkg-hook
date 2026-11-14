import { gql } from '@apollo/client'
export const DELIVERY_METHOD_ADMIN_FIELDS = gql`
  fragment DeliveryMethodAdminFields on DeliveryMethod {
    id idStore code name mode providerType collector beneficiary
    defaultFee defaultFeeMinor allowFeeOverride active revision createdAt updatedAt
  }
`
export const GET_ALL_DELIVERY_METHODS = gql`
  query GetAllDeliveryMethods($includeInactive: Boolean!) {
    getDeliveryMethods(includeInactive: $includeInactive) { ...DeliveryMethodAdminFields }
  }
  ${DELIVERY_METHOD_ADMIN_FIELDS}
`
export const CREATE_DELIVERY_METHOD = gql`
  mutation CreateDeliveryMethod($input: CreateDeliveryMethodInput!) {
    createDeliveryMethod(input: $input) { ...DeliveryMethodAdminFields }
  }
  ${DELIVERY_METHOD_ADMIN_FIELDS}
`
export const UPDATE_DELIVERY_METHOD = gql`
  mutation UpdateDeliveryMethod($id: ID!, $expectedRevision: Int!, $input: UpdateDeliveryMethodInput!) {
    updateDeliveryMethod(id: $id, expectedRevision: $expectedRevision, input: $input) { ...DeliveryMethodAdminFields }
  }
  ${DELIVERY_METHOD_ADMIN_FIELDS}
`
// Activation uses UPDATE_DELIVERY_METHOD with input: { active: true/false }.
