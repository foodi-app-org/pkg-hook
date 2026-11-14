import { gql } from '@apollo/client'
export const GET_DELIVERY_METHODS = gql`query GetPOSDeliveryMethods { getDeliveryMethods { id code name mode providerType defaultFee allowFeeOverride active revision } }`
export const QUOTE_SALE_DELIVERY = gql`query QuotePOSDelivery($input: QuoteSaleDeliveryInput!) { quoteSaleDelivery(input:$input) { methodId methodRevision mode methodName providerType currency policyVersion customerFee providerCost posCharge externalCharge merchantRevenue thirdPartyPayable merchantCost providerName providerRef } }`
export const REGISTER_SALE_WITH_DELIVERY = gql`
mutation registerSalesStore($input:[IShoppingCart],$id:ID,$tableId:ID,$discount:DiscountInput,$idStore:ID,$pCodeRef:String,$change:Float,$shoppingCartRefCode:String,$payId:ID,$pickUp:Int,$totalProductsPrice:Float,$valueDelivery:Float,$idSubArray:IID_SUB_ITEMS,$delivery:QuoteSaleDeliveryInput!,$expectedCheckoutTotal:String!) {
 registerSalesStore(input:$input,id:$id,tableId:$tableId,discount:$discount,shoppingCartRefCode:$shoppingCartRefCode,idStore:$idStore,pCodeRef:$pCodeRef,change:$change,payId:$payId,pickUp:$pickUp,totalProductsPrice:$totalProductsPrice,valueDelivery:$valueDelivery,idSubArray:$idSubArray,delivery:$delivery,expectedCheckoutTotal:$expectedCheckoutTotal) {
 success message errors { path message type context {limit value label key __typename} }
 data { pCodeRef idStore id channel payId pSState createdAt updatedAt unidProducts totalProductsPrice getOneStore { idStore cId dId catStore scheduleOpenAll dailyGoal deliveryTimeMinutes } getUser { id name email createdAt updatedAt __typename } }
 }
}`

export const GET_SALE_DELIVERY = gql`query GetSaleDelivery($saleReference:String!) { getSaleDelivery(saleReference:$saleReference) { id saleId saleReference deliveryStatus methodId methodRevision methodName mode providerType currency policyVersion customerFee providerCost posCharge externalCharge merchantRevenue thirdPartyPayable merchantCost providerName providerRef } }`
