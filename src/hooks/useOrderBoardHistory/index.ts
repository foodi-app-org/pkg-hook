import {
  gql,
  NetworkStatus,
  useQuery
} from '@apollo/client'
import { useCallback, useMemo, useRef } from 'react'

const GET_ORDER_BOARD_HISTORY = gql`
  query GetOrderBoardHistory($pCodeRef: String!, $page: Int!, $pageSize: Int!) {
    getOrderBoardHistory(pCodeRef: $pCodeRef, page: $page, pageSize: $pageSize) {
      success
      message
      code
      data {
        pCodeRef
        totalRecords
        totalPages
        currentPage
        pageSize
        hasMore
        items {
          id
          idStore
          stPId
          pCodeRef
          fromStatusId
          toStatusId
          fromStatusName
          toStatusName
          movedBy
          movedByName
          createdAt
        }
      }
    }
  }
`

export interface OrderBoardHistoryEntry {
  id: string
  idStore: string
  stPId: string
  pCodeRef: string
  fromStatusId: string
  toStatusId: string
  fromStatusName: string | null
  toStatusName: string | null
  movedBy: string
  movedByName: string | null
  createdAt: string
}

export interface OrderBoardHistoryPage {
  pCodeRef: string
  items: OrderBoardHistoryEntry[]
  totalRecords: number
  totalPages: number
  currentPage: number
  pageSize: number
  hasMore: boolean
}

export interface OrderBoardHistoryResponse {
  success: boolean
  message: string
  code?: string | null
  data: OrderBoardHistoryPage | null
}

interface HistoryQueryData {
  getOrderBoardHistory: OrderBoardHistoryResponse
}

interface HistoryQueryVariables {
  pCodeRef: string
  page: number
  pageSize: number
}

export interface UseOrderBoardHistoryOptions {
  pCodeRef?: string | null
  enabled?: boolean
  pageSize?: number
}

export function useOrderBoardHistory({
  pCodeRef,
  enabled = true,
  pageSize = 10
}: UseOrderBoardHistoryOptions) {
  const code = pCodeRef?.trim() ?? ''
  const size = Math.max(1, Math.min(50, Math.floor(pageSize)))
  const loadingNext = useRef(false)

  const query = useQuery<HistoryQueryData, HistoryQueryVariables>(
    GET_ORDER_BOARD_HISTORY,
    {
      skip: !enabled || !code,
      variables: { pCodeRef: code, page: 1, pageSize: size },
      fetchPolicy: 'network-only',
      notifyOnNetworkStatusChange: true
    }
  )

  const payload = query.data?.getOrderBoardHistory
  // Never display data for a different order while changing variables.
  const page = payload?.data?.pCodeRef === code && payload.success
    ? payload.data
    : null

  const errorMessage = query.error?.message ??
    (payload && !payload.success ? payload.message : null)

  const items = useMemo(
    () => page?.items ?? [],
    [page?.items]
  )

  const loadMore = useCallback(async (): Promise<void> => {
    if (!enabled || !code || !page?.hasMore || loadingNext.current ||
        query.networkStatus !== NetworkStatus.ready) return

    loadingNext.current = true
    try {
      await query.fetchMore({
        variables: { pCodeRef: code, page: page.currentPage + 1, pageSize: size },
        updateQuery: (previous, { fetchMoreResult }) => {
          const incoming = fetchMoreResult?.getOrderBoardHistory
          if (!incoming?.success || !incoming.data) {
            // Do not silently lose server-side validation failures.
            throw new Error(incoming?.message || 'No se pudo cargar más historial.')
          }
          if (incoming.data.pCodeRef !== code) return previous

          const older = previous.getOrderBoardHistory?.data?.items ?? []
          const deduped = new Map<string, OrderBoardHistoryEntry>()
          for (const item of [...older, ...incoming.data.items]) {
            deduped.set(item.id, item)
          }

          return {
            getOrderBoardHistory: {
              ...incoming,
              data: {
                ...incoming.data,
                items: Array.from(deduped.values())
              }
            }
          }
        }
      })
    } finally {
      loadingNext.current = false
    }
  }, [code, enabled, page, query, size])

  const refresh = useCallback(async () => {
    if (!code || !enabled) return
    await query.refetch({ pCodeRef: code, page: 1, pageSize: size })
  }, [code, enabled, query, size])

  return {
    items,
    totalRecords: page?.totalRecords ?? 0,
    hasMore: Boolean(page?.hasMore),
    loading: query.loading && query.networkStatus !== NetworkStatus.fetchMore,
    loadingMore: query.networkStatus === NetworkStatus.fetchMore,
    error: errorMessage,
    loadMore,
    refresh
  }
}
