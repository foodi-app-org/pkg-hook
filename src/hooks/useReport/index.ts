import { useQuery, useLazyQuery } from '@apollo/client'

import { GET_ALL_SALES, GET_ALL_TOTAL_SALES } from './queries'

type UseReportParams = {
  fromDate?: string;
  more: number;
  search?: string;
  channel?: string | null;
  toDate?: string;
  lazyQuery?: boolean;
};

/**
 *
 * @param root0
 * @param root0.fromDate
 * @param root0.more
 * @param root0.search
 * @param root0.channel
 * @param root0.toDate
 * @param root0.lazyQuery
 * @returns sales data
 */
function useSalesData({
  fromDate,
  more,
  search,
  channel,
  toDate,
  lazyQuery
}: UseReportParams) {
  const [getAllSalesStore, { data: lazyDataSales, loading: lazyLoading }] = useLazyQuery(GET_ALL_SALES);

  const { data, fetchMore, loading } = useQuery(GET_ALL_SALES, {
    fetchPolicy: lazyQuery ? 'cache-and-network' : 'network-only',
    skip: lazyQuery,
    variables: {
      min: 0,
      fromDate,
      channel,
      search,
      toDate,
      max: more
    }
  });

  return { getAllSalesStore, lazyDataSales, lazyLoading, data, fetchMore, loading };
}

/**
 *
 * @param root0
 * @param root0.fromDate
 * @param root0.toDate
 * @returns total sales data
 */
function useTotalSalesData({ fromDate, toDate }: { fromDate?: string; toDate?: string }) {
  const { data: totalSalesData } = useQuery(GET_ALL_TOTAL_SALES, {
    variables: {
      fromDate,
      toDate
    }
  });
  return totalSalesData?.getAllSalesStoreTotal ?? {};
}

export const useReport = ({
  fromDate = '',
  more,
  search = '',
  channel = null,
  toDate = '',
  lazyQuery = false
}: UseReportParams) => {
  const {
    getAllSalesStore,
    lazyDataSales,
    lazyLoading,
    data,
    fetchMore,
    loading
  } = useSalesData({ fromDate, more, search, channel, toDate, lazyQuery });

  const totalSales = useTotalSalesData({ fromDate, toDate });
  console.warn(totalSales);

  return {
    getAllSalesStore: lazyQuery ? getAllSalesStore : () => { }, // Return function only if in lazy mode
    data: lazyQuery ? lazyDataSales : data, // Use data from lazy query if available
    loading: lazyQuery ? lazyLoading || loading : loading,
    totalSales: totalSales.TOTAL || 0,
    restaurant: totalSales.restaurant || 0,
    delivery: totalSales.delivery || 0,
    fetchMore
  };
};
