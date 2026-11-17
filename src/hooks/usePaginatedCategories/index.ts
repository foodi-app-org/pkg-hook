import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import type { ApolloError } from '@apollo/client'
import { GET_PAGINATED_CATEGORY_PRODUCTS } from './queries'

export interface PaginatedCategory {
  __typename?: 'catProducts'
  carProId: string
  idStore?: string | null
  pName?: string | null
  ProDescription?: string | null
  ProImage?: string | null
  pState?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface CategoryPageMeta {
  totalRecords: number
  totalPages: number
  currentPage: number
  pageSize: number
  mode: string
}

export interface CategoryPaginatedResponse {
  success: boolean
  message: string
  data: PaginatedCategory[]
  pagination: CategoryPageMeta
  nextCursor?: string | null
}

export interface UsePaginatedCategoriesOptions {
  page?: number
  pageSize?: number
  search?: string
  pState?: number
  enabled?: boolean
}

export const usePaginatedCategories = ({
  page: initialPage = 1,
  pageSize: initialPageSize = 20,
  search = '',
  pState,
  enabled = true
}: UsePaginatedCategoriesOptions = {}) => {
  const [page, setPage] = useState(Math.max(1, Math.floor(initialPage)))
  const [pageSize, setPageSize] = useState(Math.max(1, Math.min(100, Math.floor(initialPageSize))))

  // Reset to first page when filtering or page size changes.
  useEffect(() => { setPage(1) }, [search, pState, pageSize])

  const { data, loading, error, refetch, networkStatus } = useQuery<{
    catProductsPaginated: CategoryPaginatedResponse
  }>(GET_PAGINATED_CATEGORY_PRODUCTS, {
    variables: {
      page,
      max: pageSize,
      search: search.trim() || undefined,
      pState,
      mode: 'offset'
    },
    skip: !enabled,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    returnPartialData: false
  })

  const result = data?.catProductsPaginated
  const meta: CategoryPageMeta = result?.pagination ?? {
    totalRecords: 0, totalPages: 0, currentPage: page,
    pageSize, mode: 'offset'
  }
  const goToPage = useCallback((nextPage: number) => {
    setPage(Math.max(1, Math.floor(nextPage)))
  }, [])
  const nextPage = useCallback(() => {
    setPage(prev => Math.min(Math.max(1, meta.totalPages), prev + 1))
  }, [meta.totalPages])
  const previousPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1))
  }, [])
  const changePageSize = useCallback((next: number) => {
    setPageSize(Math.max(1, Math.min(100, Math.floor(next))))
  }, [])

  return {
    categories: result?.data ?? [],
    data: result?.data ?? [],
    pagination: meta,
    page,
    pageSize,
    loading,
    error: error as ApolloError | undefined,
    networkStatus,
    hasNextPage: page < meta.totalPages,
    hasPreviousPage: page > 1,
    goToPage,
    nextPage,
    previousPage,
    setPageSize: changePageSize,
    refetch
  }
}
