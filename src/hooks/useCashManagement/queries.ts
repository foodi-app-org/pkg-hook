import {gql} from '@apollo/client'
const register=gql`fragment CashRegisterFields on CashRegisterView { id code name currency deviceId defaultFloatMinor minimumFloatMinor closingToleranceMinor blindCountRequired active revision policyVersion }`
const session=gql`fragment CashSessionFields on CashSessionView { id registerId status currency openedAt businessDate openedBy openingMinor openingSource previousSessionId openingVarianceMinor version movementSequence blindCountRequired roundingUnitMinor roundingRule closingCountId expectedAtCountMinor countAtCloseMinor varianceMinor retainedMinor transferredMinor expectedBalanceMinor closedAt closedBy approvedBy closingDestination reason }`
const movement=gql`fragment CashMovementFields on CashMovementView { id sessionId sequence type direction amountMinor reference reason createdAt actorId paymentId originalMovementId }`
const count=gql`fragment CashCountFields on CashCountView { id sessionId phase attemptNumber countedMinor expectedMinor varianceMinor asOfSequence countedAt countedBy }`
export const CASH_CONTEXT=gql`query CashManagementContext { cashManagementContext { allowSelfApproval storeId enabled canRead canManage canOpen canCollect canMove canClose canApprove canAudit actorId } }`
export const CASH_REGISTERS=gql`query CashRegisters { getCashRegisters { ...CashRegisterFields } } ${register}`
export const CURRENT_CASH_SESSION=gql`query CurrentCashSession($registerId:ID!) { getCurrentCashSession(registerId:$registerId) { ...CashSessionFields } } ${session}`
export const CASH_SESSIONS=gql`query CashSessions($before:ID) { getCashSessions(before:$before) { ...CashSessionFields } } ${session}`
export const CASH_SESSION=gql`query CashSession($id:ID!) { getCashSession(id:$id) { ...CashSessionFields } } ${session}`
export const CASH_MOVEMENTS=gql`query CashMovements($sessionId:ID!,$after:Int) { getCashMovements(sessionId:$sessionId,after:$after) { ...CashMovementFields } } ${movement}`
export const CASH_RECONCILIATION=gql`query CashReconciliation($sessionId:ID!) { getCashSessionReconciliation(sessionId:$sessionId) { session { ...CashSessionFields } reconstructedMinor projectionDriftMinor physicalRetainedMinor countsHistory { id attemptNumber phase countedMinor expectedMinor varianceMinor countedAt countedBy notes selected superseded } confirmedPayments paymentPostingVerification byPayment { kind appliedMinor settledMinor count } byType { type amountMinor } counts { ...CashCountFields } issues movementCount } } ${session} ${count}`
export const FINANCIAL_PAYMENT_METHODS=gql`query FinancialPaymentMethods { getFinancialPaymentMethods { payId name financialKind state } }`
export const SALE_PAYMENT_EVIDENCE=gql`query SalePaymentEvidence($saleReference:String!) { getSalePaymentEvidence(saleReference:$saleReference) { id sessionId payId paymentKind methodNameSnapshot direction status confirmationSource amountAppliedMinor settlementAmountMinor cashTenderedMinor cashChangeMinor roundingDeltaMinor confirmedAt } }`
export const SAVE_REGISTER=gql`mutation SaveRegister($input:CashRegisterInput!) { saveCashRegister(input:$input) { ...CashRegisterFields } } ${register}`
export const OPEN_SESSION=gql`mutation OpenCashSession($input:OpenCashSessionInput!) { openCashSession(input:$input) { ...CashSessionFields } } ${session}`
export const RECORD_MOVEMENT=gql`mutation RecordCashMovement($input:RecordCashMovementInput!) { recordCashMovement(input:$input) { ...CashMovementFields } } ${movement}`
export const REVERSE_MOVEMENT=gql`mutation ReverseCashMovement($input:ReverseCashMovementInput!) { reverseCashMovement(input:$input) { ...CashMovementFields } } ${movement}`
export const BEGIN_CLOSE=gql`mutation BeginCashClose($sessionId:ID!,$version:Int!) { beginCashClose(sessionId:$sessionId,version:$version) { ...CashSessionFields } } ${session}`
export const SUBMIT_COUNT=gql`mutation SubmitCashCount($input:SubmitCashCountInput!) { submitCashCount(input:$input) { ...CashCountFields } } ${count}`
export const APPROVE_CLOSE=gql`mutation ApproveCashClose($input:ApproveCashCloseInput!) { approveCashClose(input:$input) { ...CashSessionFields } } ${session}`
export const FINALIZE_CLOSE=gql`mutation FinalizeCashClose($input:FinalizeCashCloseInput!) { finalizeCashClose(input:$input) { ...CashSessionFields } } ${session}`
export const SET_PAYMENT_KIND=gql`mutation SetPaymentFinancialKind($payId:ID!,$financialKind:FinancialPaymentKind!) { setPaymentFinancialKind(payId:$payId,financialKind:$financialKind) { payId name financialKind state } }`

export const PREVIOUS_CASH_FLOAT=gql`query PreviousCashFloat($registerId:ID!) { getPreviousCashFloat(registerId:$registerId) { id retainedMinor closedAt } }`

export const DELIVERY_CASH_PAYOUT=gql`mutation DeliveryCashPayout($input:DeliveryCashPayoutInput!) { recordDeliveryCashPayout(input:$input) { ...CashMovementFields } } ${movement}`

export const CASH_SCHEMA_STATUS=gql`query CashSchemaStatus { cashSchemaStatus { ready dialect schema missingTables missingColumns missingIndexes missingConstraints incompatibleColumns } }`

export const RECOUNT_CLOSE = gql`
  mutation RecountCashClose(
    $input: RecountCashCloseInput!
  ) {
    recountCashClose(input: $input) {
      ...CashCountFields
    }
  }
  ${count}
`

export const CASH_UNLINKED_SALES = gql`
  query CashUnlinkedSales($sessionId: ID!) {
    getCashUnlinkedSales(sessionId: $sessionId) {
      sessionId
      from
      to
      count
      unknownAmountCount
      knownPayableMinor
      candidates {
        saleId
        reference
        createdAt
        paymentName
        financialKind
        payableMinor
      }
    }
  }
`