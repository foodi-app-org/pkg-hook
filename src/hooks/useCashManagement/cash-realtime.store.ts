const serializeError=(_key:string,v:unknown)=>v instanceof Error?{name:v.name,message:v.message}:v
export function createCashStore<T>(initial:T){
 let value=initial;const listeners=new Set<()=>void>()
 return {getSnapshot:()=>value,subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}},set(next:T){if(JSON.stringify(value,serializeError)===JSON.stringify(next,serializeError))return;value=next;listeners.forEach(fn=>fn())}}
}
export function retainEqual<T>(previous:T,next:T):T{return JSON.stringify(previous)===JSON.stringify(next)?previous:next}
