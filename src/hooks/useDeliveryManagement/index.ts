import { useApolloClient } from '@apollo/client'
import { useCallback, useEffect, useRef, useState } from 'react'

import { publishDeliveryCatalogChange, subscribeDeliveryCatalog } from './catalog-events'
import { assertDeliveryScope } from './policy'
import { GET_ALL_DELIVERY_METHODS, CREATE_DELIVERY_METHOD, UPDATE_DELIVERY_METHOD } from './queries'

import type { CreateDeliveryMethodInput, ManagedDeliveryMethod, UpdateDeliveryMethodInput, UpdateDeliveryMethodVariables } from './types'
export * from './types'
export * from './policy'
export * from './queries'
export type DeliveryAdminError = { message:string; code:string }
/**
 *
 * @param error
 */
export function deliveryAdminError(error:unknown): DeliveryAdminError {
  const e=error as {message?:string;graphQLErrors?:Array<{message?:string;extensions?:{code?:string}}> }|null
  const first=e?.graphQLErrors?.[0], code=first?.extensions?.code??'UNKNOWN'
  return {code,message:code==='FORBIDDEN'?'No tienes permiso para gestionar métodos de entrega.':first?.message??e?.message??'No fue posible completar la operación.'}
}
/**
 * Never reuse a root-query cache across tenants: the server takes tenant from session.
 * @param storeId
 * @param includeInactive
 */
export function useGetAllDeliveryMethods(storeId:string, includeInactive=true) {
  const client=useApolloClient(), [generation,setGeneration]=useState(0)
  const key=JSON.stringify([storeId,includeInactive,generation])
  const [result,setResult]=useState<{key:string;methods:ManagedDeliveryMethod[];error:DeliveryAdminError|null}>({key:'',methods:[],error:null})
  const refresh=useCallback(()=>setGeneration(n=>n+1),[])
  useEffect(()=>subscribeDeliveryCatalog(storeId,refresh),[storeId,refresh])
  useEffect(()=>{ if(!storeId)return;let current=true
    void client.query<{getDeliveryMethods:ManagedDeliveryMethod[]}>({query:GET_ALL_DELIVERY_METHODS,variables:{includeInactive},fetchPolicy:'no-cache',context:{queryDeduplication:false}}).then(({data})=>{
      assertDeliveryScope(data.getDeliveryMethods,storeId)
      if(current)setResult({key,methods:data.getDeliveryMethods,error:null})
    }).catch(error=>{if(current)setResult({key,methods:[],error:deliveryAdminError(error)})})
    return ()=>{current=false}
  },[client,key,storeId,includeInactive])
  return { methods:result.key===key?result.methods:[], loading:Boolean(storeId)&&result.key!==key, error:result.key===key?result.error:null, ready:Boolean(storeId)&&result.key===key&&!result.error, refresh }
}
/**
 * One shared write lock for edit/create/toggle. No optimistic writes to financial config.
 * @param storeId
 */
export function useDeliveryMethodMutations(storeId:string) {
  const client=useApolloClient(), busy=useRef(false)
  const [pending,setPending]=useState<string|null>(null)
  const storeRef=useRef(storeId);storeRef.current=storeId
  const execute=useCallback(async (kind:'create'|'update', variables:{input:CreateDeliveryMethodInput}|UpdateDeliveryMethodVariables):Promise<ManagedDeliveryMethod>=>{
    if(!storeId||storeRef.current!==storeId)throw new Error('No hay comercio activo.')
    if(busy.current)throw new Error('Ya hay una operación en curso.')
    busy.current=true;setPending(kind==='create'?'create':(variables as UpdateDeliveryMethodVariables).id)
    try {
      const response=await client.mutate<{createDeliveryMethod?:ManagedDeliveryMethod;updateDeliveryMethod?:ManagedDeliveryMethod}>({mutation:kind==='create'?CREATE_DELIVERY_METHOD:UPDATE_DELIVERY_METHOD,variables,fetchPolicy:'no-cache'})
      const method=kind==='create'?response.data?.createDeliveryMethod:response.data?.updateDeliveryMethod
      if(!method)throw new Error('El servidor no confirmó la operación.')
      assertDeliveryScope([method],storeId)
      publishDeliveryCatalogChange(storeId)
      if(storeRef.current!==storeId)throw new Error('La sesión cambió durante la operación. Consulta de nuevo el catálogo.')
      return method
    } catch(error){
      // A conflict is authoritative; refresh catalog, never silently retry the write.
      if(deliveryAdminError(error).code==='DELIVERY_CONFLICT')publishDeliveryCatalogChange(storeId)
      throw error
    } finally {busy.current=false;setPending(null)}
  },[client,storeId])
  const create=useCallback((input:CreateDeliveryMethodInput)=>execute('create',{input}),[execute])
  const update=useCallback((method:ManagedDeliveryMethod,input:UpdateDeliveryMethodInput)=>{
    assertDeliveryScope([method],storeId)
    if(method.mode==='NONE'&&input.active===false)throw new Error('El retiro sin domicilio no se puede desactivar.')
    if(!Object.keys(input).length)throw new Error('No hay cambios para guardar.')
    return execute('update',{id:method.id,expectedRevision:method.revision,input})
  },[execute,storeId])
  const setActive=useCallback((method:ManagedDeliveryMethod,active:boolean)=>update(method,{active}),[update])
  return {create,update,setActive,pending,busy:pending!==null}
}
/**
 *
 * @param storeId
 */
export function useCreateDeliveryMethod(storeId:string) {const {create,pending,busy}=useDeliveryMethodMutations(storeId);return {create,loading:busy,pending}}
/**
 *
 * @param storeId
 */
export function useUpdateDeliveryMethod(storeId:string) {const {update,pending,busy}=useDeliveryMethodMutations(storeId);return {update,loading:busy,pending}}
/**
 *
 * @param storeId
 */
export function useSetDeliveryMethodActive(storeId:string) {const {setActive,pending,busy}=useDeliveryMethodMutations(storeId);return {setActive,loading:busy,pending}}
