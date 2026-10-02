'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'

/**
 * Represents a collection of query parameters.
 *
 * Each key represents the query parameter name and its value
 * represents the parameter value.
 *
 * @example
 * ```ts
 * const query: QueryParams = {
 *   sale: '123',
 *   saleOpen: 'true',
 * }
 * ```
 */
export type QueryParams = Record<string, string>

/**
 * Provides an optional abstraction over the current location.
 *
 * This interface is mainly useful for testing, mocking the router,
 * or integrating the hook with an external routing implementation.
 */
export interface CustomLocation {
  /**
   * Query parameters to use instead of the parameters provided
   * by Next.js.
   */
  query?: QueryParams

  /**
   * Function used to navigate to a new URL.
   *
   * @param url - URL or query string to navigate to.
   */
  push?: (url: string) => void
}

/**
 * Configuration options for {@link useManageQueryParams}.
 */
export interface UseManageQueryParamsOptions {
  /**
   * Optional custom location implementation.
   *
   * When provided, the hook uses this object instead of the
   * Next.js router and search parameters.
   */
  location?: CustomLocation
}

/**
 * Options used to retrieve a dynamic route parameter.
 */
export interface GetParamsOptions {
  /**
   * Name of the dynamic route parameter.
   *
   * @example
   * For `/orders/[id]`, use `id`.
   */
  param: string

  /**
   * Optional callback executed after the parameter is retrieved.
   *
   * @param value - Resolved route parameter value.
   */
  callback?: (value: string) => void
}

/**
 * API exposed by {@link useManageQueryParams}.
 */
export interface UseManageQueryParamsResult {
  /**
   * Retrieves the value of a query parameter.
   *
   * Returns an empty string when the parameter does not exist
   * or when an invalid parameter name is provided.
   *
   * @param name - Query parameter name.
   * @returns The parameter value or an empty string.
   *
   * @example
   * ```ts
   * const sale = getQuery('sale')
   * ```
   */
  getQuery: (name: string) => string

  /**
   * Creates or updates a query parameter.
   *
   * If the parameter already exists, all existing occurrences
   * are replaced by the new value. This prevents duplicated
   * query parameters.
   *
   * @param name - Query parameter name.
   * @param value - New parameter value. Defaults to an empty string.
   *
   * @example
   * ```ts
   * handleQuery('sale', '123')
   * ```
   *
   * The following URL:
   *
   * `/orders?sale=&saleOpen=true`
   *
   * becomes:
   *
   * `/orders?sale=123&saleOpen=true`
   */
  handleQuery: (name: string, value?: string) => void

  /**
   * Removes a query parameter from the current URL.
   *
   * All occurrences of the specified parameter are removed.
   *
   * @param name - Query parameter name to remove.
   *
   * @example
   * ```ts
   * handleCleanQuery('sale')
   * ```
   *
   * `/orders?sale=123&saleOpen=true`
   *
   * becomes:
   *
   * `/orders?saleOpen=true`
   */
  handleCleanQuery: (name: string) => void

  /**
   * Retrieves a dynamic route parameter from Next.js.
   *
   * Unlike {@link getQuery}, this method reads parameters
   * defined as dynamic segments in the route.
   *
   * @param options - Route parameter configuration.
   * @returns The route parameter value or an empty string.
   *
   * @example
   * For a route such as `/orders/[id]`:
   *
   * ```ts
   * const id = getParams({
   *   param: 'id',
   * })
   * ```
   */
  getParams: (options: GetParamsOptions) => string
}

/**
 * React hook for managing URL query parameters and dynamic
 * route parameters in Next.js App Router.
 *
 * The hook provides a small abstraction around Next.js navigation
 * APIs while preventing duplicated query parameters when updating
 * existing values.
 *
 * Query parameters are internally managed using `URLSearchParams`.
 * The `set()` operation is intentionally used instead of `append()`
 * so updating a parameter replaces all existing occurrences.
 *
 * @param root0
 * @param root0.location
 * @param root0
 * @param root0.location
 * @returns An object containing query and route parameter utilities.
 *
 * @example
 * ```tsx
 * const {
 *   getQuery,
 *   handleQuery,
 *   handleCleanQuery,
 *   getParams,
 * } = useManageQueryParams()
 * ```
 *
 * @example
 * Updating a query parameter:
 *
 * ```ts
 * handleQuery('sale', '123')
 * ```
 *
 * If the current URL is:
 *
 * `/orders?sale=&saleOpen=true`
 *
 * the resulting URL is:
 *
 * `/orders?sale=123&saleOpen=true`
 *
 * instead of:
 *
 * `/orders?sale=&saleOpen=true&sale=123`
 *
 * @example
 * Removing a query parameter:
 *
 * ```ts
 * handleCleanQuery('sale')
 * ```
 *
 * @example
 * Reading a query parameter:
 *
 * ```ts
 * const sale = getQuery('sale')
 * ```
 */
export const useManageQueryParams = (
  { location }: UseManageQueryParamsOptions = {}
): UseManageQueryParamsResult => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()

  /**
   * Creates a new URLSearchParams instance from the current query.
   *
   * A new instance is created on every operation to avoid mutating
   * the read-only SearchParams object provided by Next.js.
   *
   * When a custom location is provided, its query object takes
   * precedence over the Next.js search parameters.
   *
   * @returns A mutable URLSearchParams instance.
   */
  const getCurrentQuery = (): URLSearchParams => {
    if (location?.query) {
      const query = new URLSearchParams()

      Object.entries(location.query).forEach(([key, value]) => {
        query.set(key, value)
      })

      return query
    }

    return new URLSearchParams(searchParams.toString())
  }

  /**
   * Navigates to a URL generated from the provided query parameters.
   *
   * Empty query strings are handled without adding a trailing `?`.
   *
   * @param query - Query parameters used to build the destination URL.
   */
  const push = (query: URLSearchParams): void => {
    const queryString = query.toString()

    router.push(queryString ? `?${queryString}` : '')
  }

  /**
   * Creates or updates a query parameter.
   *
   * `URLSearchParams.set()` is intentionally used because it removes
   * all existing values associated with the parameter before assigning
   * the new value.
   *
   * @param name - Query parameter name.
   * @param value - New parameter value.
   *
   * @example
   * ```ts
   * handleQuery('sale', '123')
   * ```
   */
  const handleQuery = (name: string, value = ''): void => {
    if (!name) return

    const query = getCurrentQuery()

    query.set(name, value)

    push(query)
  }

  /**
   * Removes a query parameter from the current URL.
   *
   * `URLSearchParams.delete()` removes every occurrence of the
   * specified parameter, ensuring that duplicated parameters
   * cannot remain in the resulting URL.
   *
   * @param name - Query parameter name to remove.
   *
   * @example
   * ```ts
   * handleCleanQuery('sale')
   * ```
   */
  const handleCleanQuery = (name: string): void => {
    if (!name) return

    const query = getCurrentQuery()

    query.delete(name)

    push(query)
  }

  /**
   * Retrieves the current value of a query parameter.
   *
   * When multiple values exist for the same parameter, the first
   * value is returned.
   *
   * @param name - Query parameter name.
   * @returns Query parameter value or an empty string.
   *
   * @example
   * ```ts
   * const sale = getQuery('sale')
   * ```
   */
  const getQuery = (name: string): string => {
    if (!name) return ''

    return getCurrentQuery().get(name) ?? ''
  }

  /**
   * Retrieves a dynamic route parameter from Next.js.
   *
   * The optional callback is executed with the resolved value
   * after the parameter has been retrieved.
   *
   * @param options - Route parameter configuration.
   * @param options.param
   * @param options.callback
   * @param options.param
   * @param options.callback
   * @returns Dynamic route parameter value or an empty string.
   *
   * @example
   * ```ts
   * const orderId = getParams({
   *   param: 'id',
   *   callback: (value) => {
   *     console.log(value)
   *   },
   * })
   * ```
   */
  const getParams = ({
    param,
    callback,
  }: GetParamsOptions): string => {
    if (!param) return ''

    const value = String(params?.[param] ?? '')

    callback?.(value)

    return value
  }

  return {
    getQuery,
    handleQuery,
    handleCleanQuery,
    getParams,
  }
}
