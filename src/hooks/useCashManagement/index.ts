import {useQuery,useMutation} from '@apollo/client'

import * as Q from './queries'

import type {CashContext,CashRegister,CashSession,CashMovement,CashReport,FinancialMethod,SalePaymentEvidence,CashSchemaStatus,CashUnlinkedSales} from './types'
import type {DocumentNode} from 'graphql'
export * from './types';export * from './queries';export * from './subscriptions';export * from './useCashPOS';export * from './useCashRealtime'
export * from './useCashSessionPaymentPolicy'
const options={fetchPolicy:'no-cache' as const,notifyOnNetworkStatusChange:true,context:{queryDeduplication:false}}
export const useCashContext=(enabled=true)=>useQuery<{cashManagementContext:CashContext}>(Q.CASH_CONTEXT,{...options,skip:!enabled})
export const useCashRegisters=(enabled=true)=>useQuery<{getCashRegisters:CashRegister[]}>(Q.CASH_REGISTERS,{...options,skip:!enabled})
export const useCurrentCashSession=(registerId:string,enabled=true)=>useQuery<{getCurrentCashSession:CashSession|null}>(Q.CURRENT_CASH_SESSION,{...options,variables:{registerId},skip:!registerId||!enabled})
export const useCashSessions=(enabled=true,before?:string)=>useQuery<{getCashSessions:CashSession[]}>(Q.CASH_SESSIONS,{...options,variables:{before},skip:!enabled})
export const useCashSession=(id:string,enabled=true)=>useQuery<{getCashSession:CashSession}>(Q.CASH_SESSION,{...options,variables:{id},skip:!enabled||!id,pollInterval:enabled&&id?5000:0})
export const useCashMovements=(sessionId:string,enabled=true,after=0)=>useQuery<{getCashMovements:CashMovement[]}>(Q.CASH_MOVEMENTS,{...options,variables:{sessionId,after},skip:!enabled||!sessionId,pollInterval:enabled&&sessionId?8000:0})
export const useCashReconciliation=(sessionId:string,enabled=true)=>useQuery<{getCashSessionReconciliation:CashReport}>(Q.CASH_RECONCILIATION,{...options,variables:{sessionId},skip:!enabled||!sessionId,pollInterval:enabled&&sessionId?8000:0})
export const useFinancialPaymentMethods=(enabled=true,poll=true)=>useQuery<{getFinancialPaymentMethods:FinancialMethod[]}>(Q.FINANCIAL_PAYMENT_METHODS,{...options,skip:!enabled,pollInterval:enabled&&poll?10000:0})
export const useGetSalePaymentEvidence=(saleReference:string,enabled=true)=>useQuery<{getSalePaymentEvidence:SalePaymentEvidence[]}>(Q.SALE_PAYMENT_EVIDENCE,{...options,variables:{saleReference},skip:!enabled||!saleReference})
export const usePreviousCashFloat=(registerId:string,enabled=true)=>useQuery<{getPreviousCashFloat:{id:string;retainedMinor:string;closedAt:string}|null}>(Q.PREVIOUS_CASH_FLOAT,{...options,variables:{registerId},skip:!enabled||!registerId})
export const useCashSchemaStatus=(enabled=true)=>useQuery<{cashSchemaStatus:CashSchemaStatus}>(Q.CASH_SCHEMA_STATUS,{...options,skip:!enabled})
export const useCashUnlinkedSales=(sessionId:string,enabled=true)=>useQuery<{getCashUnlinkedSales:CashUnlinkedSales}>(Q.CASH_UNLINKED_SALES,{...options,variables:{sessionId},skip:!enabled||!sessionId,pollInterval:enabled&&sessionId?8000:0})
const SESSION_QUERIES=[Q.CASH_UNLINKED_SALES,Q.CURRENT_CASH_SESSION,Q.CASH_SESSION,Q.CASH_SESSIONS,Q.PREVIOUS_CASH_FLOAT,Q.CASH_MOVEMENTS,Q.CASH_RECONCILIATION]

function useCashMutation(document:DocumentNode,refetch:DocumentNode[]){return useMutation(document,{fetchPolicy:'no-cache',refetchQueries:refetch,awaitRefetchQueries:false})}
export const useSaveCashRegister=()=>useCashMutation(Q.SAVE_REGISTER,[Q.CASH_REGISTERS,...SESSION_QUERIES])
export const useOpenCashSession=()=>useCashMutation(Q.OPEN_SESSION,SESSION_QUERIES)
export const useRecordCashMovement=()=>useCashMutation(Q.RECORD_MOVEMENT,SESSION_QUERIES)
export const useReverseCashMovement=()=>useCashMutation(Q.REVERSE_MOVEMENT,SESSION_QUERIES)
export const useBeginCashClose=()=>useCashMutation(Q.BEGIN_CLOSE,SESSION_QUERIES)
export const useCashCount=()=>useCashMutation(Q.SUBMIT_COUNT,SESSION_QUERIES)
export const useRecountCashClose=()=>useCashMutation(Q.RECOUNT_CLOSE,SESSION_QUERIES)
export const useApproveCashClose=()=>useCashMutation(Q.APPROVE_CLOSE,SESSION_QUERIES)
export const useCloseCashSession=()=>useCashMutation(Q.FINALIZE_CLOSE,SESSION_QUERIES)
export const useSetPaymentFinancialKind=()=>useCashMutation(Q.SET_PAYMENT_KIND,[Q.FINANCIAL_PAYMENT_METHODS])
export const useRecordDeliveryCashPayout=()=>useCashMutation(Q.DELIVERY_CASH_PAYOUT,SESSION_QUERIES)
