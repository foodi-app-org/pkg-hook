import { useQuery } from '@apollo/client'

import { GET_AVAILABLE_REPORTS } from './queries'
import { ReportCatalogCategory } from './types'

/**
 * Return shape of {@link useReportCatalog}.
 */
export interface UseReportCatalogResult {
  categories: ReportCatalogCategory[]
  isLoading: boolean
  error?: Error
  refetch: () => void
}

/**
 * Loads the backend-owned dynamic report catalog grouped by category. The
 * frontend builds its selection UI from this data, so new reports added on the
 * backend appear without any frontend change.
 *
 * @returns The grouped catalog, loading state and a refetch function.
 */
export const useReportCatalog = (): UseReportCatalogResult => {
  const { data, loading, error, refetch } = useQuery(GET_AVAILABLE_REPORTS, {
    fetchPolicy: 'cache-and-network'
  })

  const categories: ReportCatalogCategory[] =
    data?.getAvailableReports?.categories ?? []

  return {
    categories,
    isLoading: loading,
    error: error as Error | undefined,
    refetch: () => {
      void refetch()
    }
  }
}
