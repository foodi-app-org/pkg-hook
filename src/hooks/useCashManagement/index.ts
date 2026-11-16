import {useQuery,useMutation,useApolloClient,NetworkStatus} from '@apollo/client'
import {useState,useEffect,useCallback,useRef} from 'react'
import type {DocumentNode} from 'graphql'
import * as Q from './queries'
import type {CashContext,CashRegister,CashSession,CashMovement,CashReport,FinancialMethod,SalePaymentEvidence,CashSchemaStatus,CashUnlinkedSales} from './types'
export * from './types';export * from './queries'
// These records are financially sensitive; never persist a previous tenant's response.
const options={fetchPolicy:'no-cache' as const,notifyOnNetworkStatusChange:true,context:{queryDeduplication:false}}
export const useCashContext=(enabled=true)=>useQuery<{cashManagementContext:CashContext}>(Q.CASH_CONTEXT,{...options,skip:!enabled})
export const useCashRegisters=(enabled=true)=>useQuery<{getCashRegisters:CashRegister[]}>(Q.CASH_REGISTERS,{...options,skip:!enabled})
export const useCurrentCashSession=(registerId:string,enabled=true,poll=true)=>useQuery<{getCurrentCashSession:CashSession|null}>(Q.CURRENT_CASH_SESSION,{...options,variables:{registerId},skip:!registerId||!enabled,pollInterval:enabled&&registerId&&poll?5000:0})
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
/** Refetch only active observers, after confirmation; no optimistic update and no
 * awaitRefetchQueries: a refresh failure must not relabel a committed payment as failed. */
function useCashMutation(document:DocumentNode,refetch:DocumentNode[]){
  return useMutation(document,{fetchPolicy:'no-cache',refetchQueries:refetch,awaitRefetchQueries:false})
}
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

/** Stable contract consumed by the latest useSales + CashPOSPanel. */
export function useCashPOS(storeId:string,enabled=true,poll=true){
  const client=useApolloClient()
  const liveScope=useRef(storeId);liveScope.current=storeId
  const context=useCashContext(enabled&&!!storeId)
  const response=context.data?.cashManagementContext
  // A stale Apollo query from a previous tenant cannot authorize this checkout.
  const access=response?.storeId===storeId?response:undefined
  const [selected,setSelected]=useState<{store:string;id:string}>({store:'',id:''})
  const [storeReady,setStoreReady]=useState('')
  const [scopeReady,setScopeReady]=useState('')
  const [catalogReady,setCatalogReady]=useState('')
  const [sessionReady,setSessionReady]=useState('')
  useEffect(()=>{
    let value='';try{value=window.sessionStorage.getItem(`venty:cash-register:${storeId}`)??''}catch{}
    setSelected({store:storeId,id:value});setStoreReady(storeId)
  },[storeId])
  useEffect(()=>{
    let disposed=false;setScopeReady('')
    if(enabled&&storeId)void context.refetch().then(r=>{if(!disposed&&r.data?.cashManagementContext?.storeId===storeId)setScopeReady(storeId)}).catch(()=>{})
    return()=>{disposed=true}
  },[storeId,enabled,context.refetch])
  const active=enabled&&access?.enabled===true
  const readable=active&&access?.canRead===true&&scopeReady===storeId&&storeReady===storeId
  const registers=useCashRegisters(readable),methods=useFinancialPaymentMethods(readable,poll)
  const registerId=selected.store===storeId?selected.id:''
  const session=useCurrentCashSession(registerId,readable,poll)
  useEffect(()=>{
    let disposed=false;setCatalogReady('')
    if(readable)void Promise.all([registers.refetch(),methods.refetch()]).then(results=>{
      if(!disposed&&results[0].data&&results[1].data)setCatalogReady(storeId)
    }).catch(()=>{})
    return()=>{disposed=true}
  },[storeId,readable,registers.refetch,methods.refetch])
  const sessionScope=JSON.stringify([storeId,registerId])
  useEffect(()=>{
    let disposed=false;setSessionReady('')
    if(readable&&registerId)void session.refetch({registerId}).then(result=>{if(!disposed&&result.data)setSessionReady(sessionScope)}).catch(()=>{})
    return()=>{disposed=true}
  },[readable,registerId,sessionScope,session.refetch])
  const selectRegister=useCallback((id:string)=>{setSelected({store:storeId,id});try{window.sessionStorage.setItem(`venty:cash-register:${storeId}`,id)}catch{}},[storeId])
  const refresh=useCallback(async()=>{
    const c=await context.refetch().catch(()=>null)
    if(liveScope.current!==storeId)return
    if(c?.data?.cashManagementContext?.storeId!==storeId){setScopeReady('');return}
    setScopeReady(storeId)
    if(c.data.cashManagementContext.enabled&&c.data.cashManagementContext.canRead&&readable){
      const rs=await Promise.allSettled([registers.refetch(),methods.refetch(),...(registerId?[session.refetch({registerId})]:[])])
      if(liveScope.current!==storeId)return
      if(rs[0]?.status==='fulfilled'&&rs[1]?.status==='fulfilled')setCatalogReady(storeId)
      if(registerId&&rs[2]?.status==='fulfilled')setSessionReady(sessionScope)
    }
  },[context.refetch,storeId,readable,registers.refetch,methods.refetch,registerId,session.refetch,sessionScope])
  useEffect(()=>{if(!enabled)return;const focus=()=>{void refresh().catch(()=>{})};window.addEventListener('focus',focus);return()=>window.removeEventListener('focus',focus)},[enabled,refresh])
  const catalogCurrent=readable&&catalogReady===storeId
  const sessionCurrent=readable&&sessionReady===sessionScope
  const current=sessionCurrent?session.data?.getCurrentCashSession??null:null
  const visibleRegisters=catalogCurrent?registers.data?.getCashRegisters??[]:[]
  const visibleMethods=catalogCurrent?methods.data?.getFinancialPaymentMethods??[]:[]
  const error=context.error??(readable?(registers.error??methods.error??(registerId?session.error:undefined)):undefined)
  const isBlockingLoad=(query:{loading:boolean;networkStatus:NetworkStatus})=>query.loading&&query.networkStatus!==NetworkStatus.poll
  const known=scopeReady===storeId&&storeReady===storeId&&!!access&&!error&&!isBlockingLoad(context)&&(!active||!access.canRead||(catalogCurrent&&!isBlockingLoad(registers)&&!isBlockingLoad(methods)&&(!registerId||(sessionCurrent&&!isBlockingLoad(session)))))
  const blocking=!enabled?'':error?`No se pudo consultar caja: ${error.message}`:response&&!access&&!context.loading?'El comercio de la sesión no coincide con el seleccionado. Actualiza la caja.':!known?'Consultando la sesión de caja…':!active?'':!access?.canRead||!access?.canCollect?'No tienes permiso de cobro.':!registerId?'Selecciona una caja.':!visibleRegisters.some(r=>r.id===registerId&&r.active)?'Selecciona una caja activa.':!current||current.registerId!==registerId||current.status!=='OPEN'?'Abre una sesión de caja vigente.':current.openedBy!==access?.actorId?'La sesión pertenece a otro operador.':''
  return {enabled:active,known,access,registerId,selectRegister,registers:visibleRegisters,session:current,methods:visibleMethods,blocking,refresh,client,error}
}
