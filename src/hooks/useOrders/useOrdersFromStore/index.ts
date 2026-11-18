import { RefetchWritePolicy, useQuery, WatchQueryFetchPolicy } from '@apollo/client'
import groupBy from 'lodash/groupBy'
import { GET_ALL_ORDER_FROM_STORE } from '../queries'

type OrderDate = string | Date | null | undefined


type UseOrdersProps = {
  callback?: (data: unknown) => unknown
  refetchWritePolicy?: RefetchWritePolicy
  refetchReadPolicy?: RefetchWritePolicy
  refetch?: () => void
  statusOrder?: string
  fromDate?: string
  toDate?: string
  nextFetchPolicy?: WatchQueryFetchPolicy
  fetchPolicy?: WatchQueryFetchPolicy
  pollInterval?: number
  onError?: (error: any) => void,
    search?: string
  channel?: number
}

const toApiDate = (date: OrderDate): string | undefined => {
  if (!date) return undefined
  if (date instanceof Date) return Number.isFinite(date.getTime()) ? date.toISOString() : undefined
  return date
}

export const useOrdersFromStore = ({
  callback, fromDate, toDate, search, channel
}: UseOrdersProps = {}) => {
  const { data, loading, refetch, error, called } = useQuery(GET_ALL_ORDER_FROM_STORE, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    variables: {
      fromDate: toApiDate(fromDate),
      toDate: toApiDate(toDate),
      search: search || undefined,
      channel
    },
    onCompleted: (response: unknown) => callback?.(response)
  })

  const list = data?.getAllSalesStore ?? []
  const grouped = groupBy(list, 'status')
  return [grouped, { refetch, loading: called ? loading : true, error }] as const
}
