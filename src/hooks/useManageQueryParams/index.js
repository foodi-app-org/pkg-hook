'use client'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Hook to manage query parameters in Next.js 13+ (App Router),
 * with support for custom router/query injection.
 * @param {Object} [options] - Optional parameters.
 * @param {Object} [options.location] - Custom location object with query and push method
 */
export const useManageQueryParams = ({
  location
} = {}) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeQuery = location?.query || Object.fromEntries(searchParams.entries())
  const pushFn = location?.push || ((url) => router.push(url))

  const handleQuery = (name, value = '') => {
    const params = new URLSearchParams(activeQuery)
    params.set(name, value)
    pushFn(`?${params.toString()}`)
  }

  const handleCleanQuery = (name) => {
    const params = new URLSearchParams(activeQuery)
    params.delete(name)
    pushFn(`?${params.toString()}`)
  }

  const getQuery = (name) => {
    return activeQuery?.[name] || ''
  }

  return {
    getQuery,
    handleQuery,
    handleCleanQuery
  }
}
