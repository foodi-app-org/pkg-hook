import { computeCartTotals, minor, type CartTotals, type ReadonlyCartItem, type GlobalDiscount } from 'exact-cart-totals'

type State = { PRODUCT?: unknown; discountType?: unknown; discountPercent?: unknown; discountAmount?: unknown }
type Audit = { valid: boolean; gross: number; net: number; discount: number; discountable: number }

export function exactMerchandise(state: State, audit: Audit): { totals: CartTotals | null; issue: string } {
  try {
    if (!Array.isArray(state.PRODUCT) || !audit.valid) throw new Error('El carrito no es verificable')
    const rows: ReadonlyCartItem[] = state.PRODUCT.map((p, index) => {
      if (!p || typeof p !== 'object' || p.unitPrice == null) throw new Error('Recupera el precio unitario original del producto antes de cobrar')
      // The original unit price, not the discounted line value, is also needed for courtesy snapshots.
      return {shoppingCartId:`pos-${index}`,priceProduct:p.unitPrice,cantProducts:p.ProQuantity,free:p.free??false,
        products:{ProPrice:p.unitPrice,dataExtra:p.dataExtra??[]}}
    })
    const type=state.discountType??'PERCENT'
    if(type!=='PERCENT'&&type!=='AMOUNT')throw new Error('Tipo de descuento inválido')
    const discount:GlobalDiscount={type,value:Number(type==='AMOUNT'?state.discountAmount??0:state.discountPercent??0)}
    const totals=computeCartTotals(rows,{pricingMode:'pos',includeExtras:true,globalDiscount:discount})
    for(const [expected,actual] of [[totals.exact.subtotal,audit.gross],[totals.exact.netTotal,audit.net],[totals.exact.discountAmount,audit.discount],[totals.exact.discountableSubtotal,audit.discountable]]){
      if(minor(expected)!==minor(actual))throw new Error('Los importes del carrito no coinciden con exact-cart-totals')
    }
    return {totals,issue:''}
  }catch(e){return {totals:null,issue:e instanceof Error?e.message:'No se pudo verificar el carrito'}}
}
