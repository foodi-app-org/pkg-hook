'use client'
/**
 * Hook to manage query parameters in Next.js 13+ (App Router),
 * with support for custom router/query injection.
 */
export const useManageQueryParams = ({ router, searchParams } = {}) => {
  const activeQuery = Object.fromEntries(searchParams.entries())
  const pushFn = (url) => router.push(url)

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

  return {
    handleQuery,
    handleCleanQuery
  }
}
