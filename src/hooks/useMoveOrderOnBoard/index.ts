import { gql, useMutation } from '@apollo/client'

const MOVE_ORDER_BOARD_STATUS = gql`
  mutation MoveOrderBoardStatus($input: MoveOrderBoardInput!) {
    moveOrderBoardStatus(input: $input) {
      success
      message
      code
      data {
        pCodeRef
        fromStatusId
        toStatusId
        toStatusName
        changed
        changedAt
      }
    }
  }
`

export interface MoveOrderBoardInput {
  pCodeRef: string
  expectedStatusId: string
  toStatusId: string
}

export interface MoveOrderBoardResponse {
  success: boolean
  message: string
  code?: string | null
  data?: {
    pCodeRef: string
    fromStatusId: string
    toStatusId: string
    toStatusName: string
    changed: boolean
    changedAt: string
  } | null
}

export function useMoveOrderOnBoard() {
  const [mutate, mutation] = useMutation<{
    moveOrderBoardStatus: MoveOrderBoardResponse
  }, { input: MoveOrderBoardInput }>(MOVE_ORDER_BOARD_STATUS)

  const moveOrder = async (input: MoveOrderBoardInput): Promise<MoveOrderBoardResponse> => {
    const response = await mutate({ variables: { input } })
    const result = response.data?.moveOrderBoardStatus
    if (!result) throw new Error('No se recibió respuesta del servidor.')
    if (!result.success) throw new Error(result.message || 'No fue posible mover la orden.')
    return result
  }

  return { moveOrder, loading: mutation.loading, error: mutation.error }
}
