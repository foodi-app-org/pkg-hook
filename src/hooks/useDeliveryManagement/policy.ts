import { cents, decimal } from '../useDeliveryCheckout/money'
import type { CreateDeliveryMethodInput, DeliveryMethodDraft, DeliveryMode, ManagedDeliveryMethod, UpdateDeliveryMethodInput } from './types'
export const DELIVERY_MODE_INFO = {
  NONE: { label: 'Sin domicilio / retiro', description: 'No se cobra servicio de entrega.', collector: 'Sin cobro', beneficiary: 'No aplica', free: true },
  MERCHANT: { label: 'Domicilio propio', description: 'El comercio presta y cobra el servicio.', collector: 'Comercio', beneficiary: 'Comercio', free: false },
  MERCHANT_EXTERNAL: { label: 'Servicio propio tercerizado', description: 'El comercio cobra el servicio y asume el costo del proveedor.', collector: 'Comercio', beneficiary: 'Comercio', free: false },
  THIRD_PARTY_COLLECTED: { label: 'Recaudo para terceros', description: 'El comercio cobra la tarifa y debe entregarla al proveedor.', collector: 'Comercio', beneficiary: 'Proveedor', free: false },
  THIRD_PARTY_DIRECT: { label: 'Pago directo al repartidor', description: 'El cliente le paga al proveedor; no entra en el cobro POS.', collector: 'Proveedor', beneficiary: 'Proveedor', free: false },
  MERCHANT_SUBSIDIZED: { label: 'Domicilio gratuito propio', description: 'El comercio asume el costo. El cliente no paga el envío.', collector: 'Sin cobro', beneficiary: 'No aplica', free: true },
  MERCHANT_SUBSIDIZED_EXTERNAL: { label: 'Domicilio externo subsidiado', description: 'El comercio paga al proveedor externo; el cliente no paga el envío.', collector: 'Sin cobro', beneficiary: 'No aplica', free: true }
} satisfies Record<DeliveryMode,{ label:string;description:string;collector:string;beneficiary:string;free:boolean }>
export const DELIVERY_MODES = Object.keys(DELIVERY_MODE_INFO) as DeliveryMode[]
export function formatDeliveryMoney(value: string | null): string {
  if (value === null) return 'Definir en caja'
  const [whole, fraction] = decimal(cents(value)).split('.')
  return `$ ${whole.replace(/\B(?=(\d{3})+(?!\d))/g,'.')},${fraction}`
}
export function initialDeliveryDraft(mode: DeliveryMode = 'MERCHANT'): DeliveryMethodDraft {
  const free = DELIVERY_MODE_INFO[mode].free
  return { code:'',name:'',mode,defaultFee:free?'0.00':'',variableFee:!free,allowFeeOverride:!free,active:false }
}
export function editDeliveryDraft(m: ManagedDeliveryMethod): DeliveryMethodDraft {
  return {code:m.code,name:m.name,mode:m.mode,defaultFee:m.defaultFee??'',variableFee:m.defaultFee===null,allowFeeOverride:m.allowFeeOverride,active:m.active}
}
export function changeDraftMode(draft: DeliveryMethodDraft, mode: DeliveryMode): DeliveryMethodDraft {
  const next = initialDeliveryDraft(mode)
  return {...next,code:draft.code,name:draft.name,active:mode==='NONE'?true:draft.active}
}
export function normalizeDeliveryDraft(draft: DeliveryMethodDraft): CreateDeliveryMethodInput {
  const name=draft.name.trim(), code=draft.code.trim().toUpperCase()
  if (!name || name.length>120) throw new Error('El nombre debe tener entre 1 y 120 caracteres.')
  if (!/^[A-Z][A-Z0-9_]{0,47}$/.test(code)) throw new Error('Código: máximo 48 caracteres, letras mayúsculas, números y guion bajo; empieza con una letra.')
  const info=DELIVERY_MODE_INFO[draft.mode]
  if (!info) throw new Error('Modalidad no válida.')
  let defaultFee: string|null
  let allowFeeOverride: boolean
  if(info.free){ defaultFee='0.00'; allowFeeOverride=false }
  else if(draft.variableFee){ defaultFee=null; allowFeeOverride=true }
  else {
    const amount=cents(draft.defaultFee.trim().replace(',','.'))
    if(amount<=BigInt(0)) throw new Error('La tarifa debe ser mayor que cero.')
    defaultFee=decimal(amount); allowFeeOverride=draft.allowFeeOverride
  }
  if(draft.mode==='NONE'&&!draft.active) throw new Error('El retiro sin domicilio siempre debe estar activo.')
  return {code,name,mode:draft.mode,defaultFee,allowFeeOverride,active:draft.active}
}
export function buildDeliveryUpdate(original: ManagedDeliveryMethod, draft: DeliveryMethodDraft): UpdateDeliveryMethodInput {
  if(original.mode!==draft.mode||original.code!==draft.code) throw new Error('El código y la modalidad financiera no se editan. Crea un método nuevo.')
  const next=normalizeDeliveryDraft(draft), patch: UpdateDeliveryMethodInput={}
  if(next.name!==original.name) patch.name=next.name
  if(next.defaultFee!==original.defaultFee) patch.defaultFee=next.defaultFee
  if(next.allowFeeOverride!==original.allowFeeOverride) patch.allowFeeOverride=next.allowFeeOverride
  if(next.active!==original.active) patch.active=next.active
  return patch
}
export function assertDeliveryScope(methods: readonly ManagedDeliveryMethod[], storeId:string): void {
  if(!storeId||methods.some(m=>m.idStore!==storeId)) throw new Error('La sesión del comercio cambió. Vuelve a cargar la página.')
}
