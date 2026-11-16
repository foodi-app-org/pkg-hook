import { gql } from '@apollo/client'
export type CashTopic='SESSION'|'CATALOG'|'PAYMENTS'|'REPORTS'
export type CashSignal={eventId:string;storeId:string;actorId:string;kind:'READY'|'CHANGE'|'HEARTBEAT';topics:CashTopic[]}
export const CASH_MANAGEMENT_CHANGED=gql`subscription CashManagementChanged($storeId:String!){cashManagementChanged(storeId:$storeId){eventId storeId actorId kind topics}}`

export const POS_SESSION=gql`query CashPOSSession($registerId:ID!){getCurrentCashSession(registerId:$registerId){id registerId status openedBy businessDate roundingUnitMinor roundingRule}}`
