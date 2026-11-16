import {useApolloClient} from '@apollo/client'
import {useEffect,useRef} from 'react'
import {CASH_MANAGEMENT_CHANGED,type CashSignal} from './subscriptions'
export function useCashRealtime(storeId:string,enabled:boolean,onSignal:(event:CashSignal)=>void,onLost:(error:Error)=>void){
 const client=useApolloClient();const callbacks=useRef({storeId,enabled,onSignal,onLost});callbacks.current={storeId,enabled,onSignal,onLost}
 useEffect(()=>{
  if(!enabled||!storeId)return
  let stopped=false,attempt=0,epoch=0,subscription:{unsubscribe():void}|undefined,timer:ReturnType<typeof setTimeout>|undefined,watchdog:ReturnType<typeof setTimeout>|undefined
  const clear=()=>{if(timer)clearTimeout(timer);if(watchdog)clearTimeout(watchdog)}
  const start=()=>{
   if(stopped)return;const generation=++epoch;let ready=false;const seen=new Set<string>()
   const fail=(message:string)=>{if(stopped||epoch!==generation||callbacks.current.storeId!==storeId||!callbacks.current.enabled)return;++epoch;clear();subscription?.unsubscribe();callbacks.current.onLost(new Error(message));timer=setTimeout(start,Math.min(30000,1000*2**Math.min(attempt++,5))+Math.floor(Math.random()*500))}
   const arm=()=>{if(watchdog)clearTimeout(watchdog);watchdog=setTimeout(()=>fail('Conexión de caja sin respuesta'),40000)}
   arm()
   subscription=client.subscribe<{cashManagementChanged:CashSignal}>({query:CASH_MANAGEMENT_CHANGED,variables:{storeId},fetchPolicy:'no-cache',context:{clientName:'CASH_REALTIME',queryDeduplication:false}}).subscribe({next:result=>{
    if(stopped||generation!==epoch||callbacks.current.storeId!==storeId||!callbacks.current.enabled)return
    const event=result.data?.cashManagementChanged
    if(result.errors?.length||!event||event.storeId!==storeId){fail('Suscripción de caja no autorizada o inválida');return}
    arm();if(event.kind==='READY'){ready=true;attempt=0;seen.clear();callbacks.current.onSignal(event);return}
    if(!ready){fail('Falta estado inicial de caja');return}
    if(event.kind==='HEARTBEAT'){callbacks.current.onSignal(event);return}
    if(seen.has(event.eventId))return
    seen.add(event.eventId);if(seen.size>512)seen.delete(seen.values().next().value!)
    callbacks.current.onSignal(event)
   },error:()=>fail('Conexión de caja interrumpida'),complete:()=>fail('Conexión de caja finalizada')})
   if(epoch!==generation)subscription.unsubscribe()
  }
  start();return()=>{stopped=true;++epoch;clear();subscription?.unsubscribe()}
 },[client,storeId,enabled])
}
