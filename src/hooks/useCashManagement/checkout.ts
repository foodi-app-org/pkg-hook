import {minor,formatMinor} from 'exact-cart-totals'

import type {CashSession,FinancialKind} from './types'
/**
 *
 * @param session
 * @param kind
 * @param total
 * @param received
 */
export function verifyPhysicalCheckout(session:Pick<CashSession,'roundingUnitMinor'|'roundingRule'>|null,kind:FinancialKind|undefined,total:unknown,received:unknown):string {
 if(!kind||kind==='UNKNOWN')return 'Clasifica el medio de pago en Finanzas.'
 if(kind!=='CASH')return ''
 if(!session)return 'Abre la caja antes de cobrar.'
 try{const unit=BigInt(session.roundingUnitMinor);if(session.roundingRule!=='REJECT'||unit<=BigInt(0))return 'Política de efectivo incompatible. Revisa configuración.';if(minor(total)%unit!==BigInt(0))return 'El importe no es representable en efectivo. Selecciona otro medio.';if(received!=null&&minor(received)%unit!==BigInt(0))return 'El efectivo recibido no coincide con las denominaciones disponibles.'}catch{return 'Importe de cobro inválido.'}return ''
}
export const canonicalMoney=(x:unknown)=>formatMinor(minor(x))
