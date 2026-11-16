import {useApolloClient} from '@apollo/client'
import {useCallback,useEffect,useMemo,useRef,useSyncExternalStore} from 'react'
import * as Q from './queries'
import type {CashContext,CashRegister,CashSession,FinancialMethod} from './types'
import {createCashStore,retainEqual} from './cash-realtime.store'
import {useCashRealtime} from './useCashRealtime'
import {POS_SESSION,type CashSignal,type CashTopic} from './subscriptions'
export type CashPOSSession=Pick<CashSession,'id'|'registerId'|'status'|'openedBy'|'businessDate'|'roundingUnitMinor'|'roundingRule'>
const EMPTY_REGISTERS:CashRegister[]=[];const EMPTY_METHODS:FinancialMethod[]=[]
type Snapshot={access?:CashContext;registerId:string;registers:CashRegister[];methods:FinancialMethod[];session:CashPOSSession|null;known:boolean;connection:'connecting'|'live'|'offline';error?:Error}
const initial=():Snapshot=>({registerId:'',registers:EMPTY_REGISTERS,methods:EMPTY_METHODS,session:null,known:false,connection:'connecting'})
export function useCashPOS(storeId:string,enabled=true,_poll=false){
 const client=useApolloClient()
 const store=useMemo(()=>createCashStore(initial()),[client,storeId,enabled])
 const state=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot)
 const control=useMemo(()=>({alive:false,connected:false,revision:0,busy:false,dirty:new Set<CashTopic>(),full:false,selected:'',actorId:'',waiters:[] as Array<()=>void>}),[store])
 const scope=useRef(store);scope.current=store
 const valid=()=>control.alive&&scope.current===store
 const query=useCallback(async<T,>(document:any,variables?:Record<string,unknown>)=>{
  const result=await client.query<T>({query:document,variables,fetchPolicy:'no-cache',errorPolicy:'none',context:{queryDeduplication:false,cashScope:{storeId,actorId:control.actorId}}})
  if(result.errors?.length||!result.data)throw new Error('Respuesta de caja inválida');return result.data
 },[client,storeId,control])
 const run=useCallback(async()=>{
  if(control.busy||!control.alive||!control.connected)return
  control.busy=true
  try{while(control.alive&&control.connected&&(control.full||control.dirty.size)){
   const full=control.full,topics=new Set(control.dirty),rev=control.revision,registerId=control.selected;control.full=false;control.dirty.clear()
   const previous=store.getSnapshot()
   try{
    const access=full||!previous.access?(await query<{cashManagementContext:CashContext}>(Q.CASH_CONTEXT)).cashManagementContext:previous.access
    if(!access||access.storeId!==storeId||!access.actorId||access.actorId!==control.actorId)throw new Error('El comercio u operador no coincide')
    const readable=access.enabled&&access.canRead
    const catalog=readable&&(full||topics.has('CATALOG'))
    const readSession=readable&&Boolean(registerId)&&(full||topics.has('SESSION')||topics.has('CATALOG'))
    const [registers,methods,session]=await Promise.all([
     !readable?EMPTY_REGISTERS:catalog?query<{getCashRegisters:CashRegister[]}>(Q.CASH_REGISTERS).then(x=>x.getCashRegisters):previous.registers,
     !readable?EMPTY_METHODS:catalog?query<{getFinancialPaymentMethods:FinancialMethod[]}>(Q.FINANCIAL_PAYMENT_METHODS).then(x=>x.getFinancialPaymentMethods):previous.methods,
     !readable||!registerId?null:readSession?query<{getCurrentCashSession:CashPOSSession|null}>(POS_SESSION,{registerId}).then(x=>x.getCurrentCashSession):previous.session
    ])
    if(!control.alive||scope.current!==store||!control.connected||rev!==control.revision)continue
    if(session&&session.registerId!==registerId)throw new Error('Sesión de caja inválida')
    store.set({access:retainEqual(previous.access,access),registerId,registers:retainEqual(previous.registers,registers),methods:retainEqual(previous.methods,methods),session:retainEqual(previous.session,session),known:true,connection:'live'})
   }catch(e){if(control.alive&&scope.current===store&&control.connected&&rev===control.revision)store.set({...initial(),registerId,connection:'offline',error:e instanceof Error?e:new Error('No se pudo consultar caja')})}
  }}finally{control.busy=false;control.waiters.splice(0).forEach(fn=>fn())}
 },[control,query,store,storeId])
 const refresh=useCallback(async()=>{if(!control.alive||!control.connected)return;++control.revision;control.full=true;store.set({...store.getSnapshot(),known:false});const done=new Promise<void>(resolve=>control.waiters.push(resolve));void run();await done},[control,run,store])
 useEffect(()=>{control.alive=true;try{control.selected=window.sessionStorage.getItem(`venty:cash-register:${storeId}`)??''}catch{};store.set({...initial(),registerId:control.selected});return()=>{control.alive=false;control.connected=false;++control.revision;control.waiters.splice(0).forEach(fn=>fn())}},[control,store,storeId])
 const onSignal=(event:CashSignal)=>{
  if(!valid())return
  if(event.kind==='READY'){control.connected=true;control.actorId=event.actorId;++control.revision;control.full=true;store.set({...initial(),registerId:control.selected});void run();return}
  if(!control.connected)return
  if(event.actorId!==control.actorId){control.connected=false;++control.revision;store.set({...initial(),registerId:control.selected,connection:'offline',error:new Error('El operador de caja cambió')});return}
  if(event.kind==='HEARTBEAT'){
   if(!control.busy&&!store.getSnapshot().known){control.full=true;void run()}
   return
  }
  // PAYMENT/REPORT signals alone do not affect checkout eligibility.
  if(event.topics.includes('SESSION'))control.dirty.add('SESSION')
  if(event.topics.includes('CATALOG'))control.dirty.add('CATALOG')
  if(control.dirty.size){
   ++control.revision
   // If work is already in flight, its snapshot is no longer authoritative.
   if(control.busy)control.full=true
   store.set({...store.getSnapshot(),known:false})
   void run()
  }
 }
 useCashRealtime(storeId,enabled&&Boolean(storeId),onSignal,error=>{if(!valid())return;control.connected=false;++control.revision;control.full=false;control.dirty.clear();store.set({...initial(),registerId:control.selected,connection:'offline',error})})
 const selectRegister=useCallback((id:string)=>{if(scope.current!==store||!control.alive||id===control.selected)return;control.selected=id;++control.revision;try{window.sessionStorage.setItem(`venty:cash-register:${storeId}`,id)}catch{};store.set({...store.getSnapshot(),registerId:id,session:null,known:false});control.full=true;void run()},[control,store,storeId,run])
 const access=state.access,active=enabled&&access?.enabled===true,known=enabled?state.known:false,registerId=state.registerId,current=state.session
 const blocking=!enabled?'':state.error?`No se pudo sincronizar caja: ${state.error.message}`:!known?'Consultando la sesión de caja…':!active?'':!access?.canRead||!access.canCollect?'No tienes permiso de cobro.':!registerId?'Selecciona una caja.':!state.registers.some(r=>r.id===registerId&&r.active)?'Selecciona una caja activa.':!current||current.registerId!==registerId||current.status!=='OPEN'?'Abre una sesión de caja vigente.':current.openedBy!==access.actorId?'La sesión pertenece a otro operador.':''
 return useMemo(()=>({enabled:active,known,access,registerId,selectRegister,registers:state.registers,session:current,methods:state.methods,blocking,refresh,client,error:state.error,connection:state.connection}),[active,known,access,registerId,selectRegister,state.registers,current,state.methods,blocking,refresh,client,state.error,state.connection])
}
