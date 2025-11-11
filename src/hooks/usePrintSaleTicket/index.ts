// usePrintSaleTicket.ts
import { gql, useMutation, MutationHookOptions } from '@apollo/client'
import { useCallback } from 'react'

/* ------------------------------
   TYPES
------------------------------ */

export interface PrintSaleTicketResponse {
  printSaleTicket: {
    message: string
    success: boolean
    data: string | null
    __typename: string
  }
}

export interface PrintSaleTicketVars {
  saleId: string
}

/* ------------------------------
   GQL
------------------------------ */

const PRINT_SALE_TICKET = gql`
  mutation printSaleTicket($saleId: ID!) {
    printSaleTicket(saleId: $saleId) {
      message
      success
      data
      __typename
    }
  }
`

/* ------------------------------
   HOOK
------------------------------ */

export function usePrintSaleTicket(
  options?: MutationHookOptions<PrintSaleTicketResponse, PrintSaleTicketVars>
) {
  const [runMutation, { loading, data, error }] = useMutation<
    PrintSaleTicketResponse,
    PrintSaleTicketVars
  >(PRINT_SALE_TICKET, options)

  const printSale = useCallback(
    async (saleId: string) => {
      const result = await runMutation({
        variables: { saleId }
      })
      return result.data?.printSaleTicket
    },
    [runMutation]
  )

  return [printSale, {
    loading,
    data: data?.printSaleTicket,
    error
  }]
}
