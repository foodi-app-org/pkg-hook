'use client'

import { useRouter, useSearchParams, useParams } from 'next/navigation'

/**
 * Generic query params map
 */
export type QueryParams = Record<string, string>

/**
 * Custom location interface (useful for testing or external routers)
 */
export interface CustomLocation {
  query?: QueryParams
  push?: (url: string) => void
}

/**
 * Hook options
 */
export interface UseManageQueryParamsOptions {
  location?: CustomLocation
}

/**
 * Params getter options
 */
export interface GetParamsOptions {
  param: string
  callback?: (value: string) => void
}

/**
 * Hook return type
 */
export interface UseManageQueryParamsResult {
  getQuery: (name: string) => string
  handleQuery: (name: string, value?: string) => void
  handleCleanQuery: (name: string) => void
  getParams: (options: GetParamsOptions) => string
}

/**
 * Hook to manage query parameters in Next.js 13+ (App Router)
 * Supports dependency injection for router/query (testing-friendly).
 *
 * @param {UseManageQueryParamsOptions} options
 * @returns {UseManageQueryParamsResult}
 */
export const useManageQueryParams = (
  { location }: UseManageQueryParamsOptions = {}
): UseManageQueryParamsResult => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()

  const activeQuery: QueryParams =
    location?.query ??
    Object.fromEntries(searchParams.entries())

  const pushFn = location?.push ?? ((url: string) => {return router.push(url)})

  /**
   * Set or update a query param
   * @param name
   * @param value
   */
  const handleQuery = (name: string, value = ''): void => {
    if (!name) return

    const query = new URLSearchParams(activeQuery)
    query.set(name, value)

    pushFn(`?${query.toString()}`)
  }

  /**
   * Remove a query param
   * @param name
   */
  const handleCleanQuery = (name: string): void => {
    if (!name) return

    const query = new URLSearchParams(activeQuery)
    query.delete(name)

    pushFn(`?${query.toString()}`)
  }

  /**
   * Get a query param value
   * @param name
   * @returns {string}
   */
  const getQuery = (name: string): string => {
    if (!name) return ''
    return activeQuery?.[name] ?? ''
  }

  /**
   * Get a dynamic route param from Next.js
   * @param root0
   * @param root0.param
   * @param root0.callback
   * @returns {string}
   */
  const getParams = ({ param, callback }: GetParamsOptions): string => {
    if (!param) return ''

    const value = String(params?.[param] ?? '')
    callback?.(value)

    return value
  }

  return {
    getQuery,
    handleQuery,
    handleCleanQuery,
    getParams
  }
}
