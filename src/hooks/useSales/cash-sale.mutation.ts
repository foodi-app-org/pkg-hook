import { gql } from '@apollo/client'
export const REGISTER_SALE_WITH_CASH = gql`
mutation registerSalesStore($input:[IShoppingCart],$id:ID,$tableId:ID,$discount:DiscountInput,$idStore:ID,$pCodeRef:String,$change:Float,$shoppingCartRefCode:String,$payId:ID,$pickUp:Int,$totalProductsPrice:Float,$valueDelivery:Float,$idSubArray:IID_SUB_ITEMS,$delivery:QuoteSaleDeliveryInput!,$expectedCheckoutTotal:String!,$cashSessionId:ID,$paymentInput:SalePaymentInput) {
 registerSalesStore(input:$input,id:$id,tableId:$tableId,discount:$discount,shoppingCartRefCode:$shoppingCartRefCode,idStore:$idStore,pCodeRef:$pCodeRef,change:$change,payId:$payId,pickUp:$pickUp,totalProductsPrice:$totalProductsPrice,valueDelivery:$valueDelivery,idSubArray:$idSubArray,delivery:$delivery,expectedCheckoutTotal:$expectedCheckoutTotal,cashSessionId:$cashSessionId,paymentInput:$paymentInput) {
 success message errors { path message type }
 data { pCodeRef idStore }
 }
}`

