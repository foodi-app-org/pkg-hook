import { useApolloClient, useLazyQuery } from '@apollo/client'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { blankDraft, checkoutTotals, draftFor, makeInput, numberMoney } from './money'
import { GET_DELIVERY_METHODS, QUOTE_SALE_DELIVERY, GET_SALE_DELIVERY } from './queries'

import type { DeliveryDraft, DeliveryInput, DeliveryMethod, DeliveryQuote, DeliveryTotals } from './types'
export type { DeliveryMode, DeliveryDraft, DeliveryMethod, DeliveryQuote, DeliveryInput, DeliveryTotals } from './types'
export { GET_DELIVERY_METHODS, QUOTE_SALE_DELIVERY, GET_SALE_DELIVERY, REGISTER_SALE_WITH_DELIVERY } from './queries'
const errorText = (e: unknown) => e instanceof Error ? e.message : 'No fue posible consultar el domicilio'


export function useDeliveryMethods(storeId: string, enabled=true) {
  const client=useApolloClient(); const [version,setVersion]=useState(0)
  const key=JSON.stringify([storeId,version,enabled])
  const [result,setResult]=useState<{key:string;methods:DeliveryMethod[];error:string}>({key:'',methods:[],error:''})
  useEffect(()=>{ if(!enabled||!storeId)return; let live=true
    client.query<{getDeliveryMethods:DeliveryMethod[]}>({query:GET_DELIVERY_METHODS,fetchPolicy:'no-cache',context:{queryDeduplication:false}}).then(r=>{if(live)setResult({key,methods:r.data.getDeliveryMethods.filter(m=>m.active),error:''})}).catch(e=>{if(live)setResult({key,methods:[],error:errorText(e)})})
    return()=>{live=false}
  },[client,key,enabled,storeId])
  return {methods:result.key===key?result.methods:[],loading:enabled&&Boolean(storeId)&&result.key!==key,error:result.key===key?result.error:'',refresh:()=>setVersion(n=>n+1),catalogKey:key}
}

export function useDeliveryQuote(input: DeliveryInput|null, key: string) {
  const client=useApolloClient()
  const [response,setResponse]=useState<{key:string;quote:DeliveryQuote|null;error:string}>({key:'',quote:null,error:''})
  const [retry,setRetry]=useState(0)
  const requestKey=key&&input?JSON.stringify([key,input,retry]):''
  useEffect(()=>{if(!requestKey)return;let live=true;const currentInput=input!;const timer=setTimeout(()=>{
    client.query<{quoteSaleDelivery:DeliveryQuote}>({query:QUOTE_SALE_DELIVERY,variables:{input:currentInput},fetchPolicy:'no-cache',context:{queryDeduplication:false}}).then(r=>{if(!live)return;const q=r.data.quoteSaleDelivery;if(q.methodId!==currentInput.methodId||q.methodRevision!==currentInput.expectedRevision)throw new Error('La modalidad cambió; vuelve a consultar');setResponse({key:requestKey,quote:q,error:''})}).catch(e=>{if(live)setResponse({key:requestKey,quote:null,error:errorText(e)})})
  },250);return()=>{live=false;clearTimeout(timer)}},[client,requestKey])
  const quote=response.key===requestKey&&requestKey?response.quote:null
  const invalidate=useCallback(()=>setRetry(n=>n+1),[])
  return {quote,pending:Boolean(requestKey)&&response.key!==requestKey,error:requestKey&&response.key===requestKey?response.error:'',invalidate}
}
/**
 *
 * @param root0
 * @param root0.storeId
 * @param root0.enabled
 * @param root0.net
 * @param root0.hasItems
 */
export function useDeliveryCheckout({storeId,enabled=true,net,hasItems}:{storeId:string;enabled?:boolean;net:number;hasItems:boolean}) {
  const catalog=useDeliveryMethods(storeId,enabled)
  const [selection,setSelection]=useState<{storeId:string;draft:DeliveryDraft;explicit:boolean}>({storeId:'',draft:blankDraft(),explicit:true})
  const scoped=selection.storeId===storeId?selection:{storeId,draft:blankDraft(),explicit:true}
  const defaultMethod=catalog.methods.find(m=>m.mode==='NONE')
  const draft=scoped.draft.methodId||scoped.explicit?scoped.draft:defaultMethod?draftFor(defaultMethod):scoped.draft
  const method=catalog.methods.find(m=>m.id===draft.methodId)
  const prepared=useMemo(()=>{try{return {input:method?makeInput(method,draft):null,error:method?'':'Selecciona una modalidad de entrega'}}catch(e){return {input:null,error:errorText(e)}}},[method,draft.methodId,draft.customerFee,draft.providerCost,draft.providerName,draft.providerRef])
  const key=enabled&&hasItems&&prepared.input?JSON.stringify([catalog.catalogKey,prepared.input]):''
  const quoted=useDeliveryQuote(prepared.input,key)
  const quote=quoted.quote
  const invalidate=quoted.invalidate
  let totals: DeliveryTotals|null=null, posCharge=0, amountsError=''
  if(quote){try{totals=checkoutTotals(String(net),quote);posCharge=numberMoney(totals.posCharge);numberMoney(totals.checkoutTotal)}catch(e){amountsError=errorText(e);totals=null}}
  const pending=quoted.pending
  const error=catalog.error||prepared.error||quoted.error||amountsError
  const ready=Boolean(enabled&&hasItems&&quote&&totals&&!error&&!catalog.loading&&!pending)
  const select=useCallback((id:string)=>{const m=catalog.methods.find(x=>x.id===id);setSelection({storeId,draft:m?draftFor(m):blankDraft(),explicit:true});invalidate()},[catalog.methods,storeId,invalidate])
  const edit=(field:Exclude<keyof DeliveryDraft,'methodId'>,value:string)=>{setSelection({storeId,draft:{...draft,[field]:value},explicit:true});invalidate()}
  const reset=useCallback(()=>{setSelection({storeId,draft:blankDraft(),explicit:false});invalidate()},[storeId,invalidate])
  const restore=useCallback((saved:DeliveryDraft|null,requireSelection=false)=>{const clean=blankDraft();if(saved&&typeof saved==='object')for(const k of Object.keys(clean) as (keyof DeliveryDraft)[])if(typeof saved[k]==='string')clean[k]=saved[k];setSelection({storeId,draft:clean,explicit:requireSelection||Boolean(clean.methodId)});invalidate()},[storeId,invalidate])
  return { ...catalog,draft,method,quote,totals,posCharge,ready,pending,error,select,edit,reset,restore,retry:()=>{catalog.refresh();invalidate()},input:ready?prepared.input:null,blockingMessage:ready?'':catalog.loading?'Cargando modalidades de domicilio…':pending?'Cotizando domicilio…':error||'Confirma la modalidad de entrega' }
}
export type DeliveryCheckout = ReturnType<typeof useDeliveryCheckout>

/**
 *
 */
export function useGetSaleDelivery() {
  return useLazyQuery<{getSaleDelivery:(DeliveryQuote & {id:string;saleId:string;saleReference:string;deliveryStatus:string})|null},{saleReference:string}>(GET_SALE_DELIVERY,{fetchPolicy:'no-cache',context:{queryDeduplication:false}})
}
