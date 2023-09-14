import { useQuery } from '@apollo/client';
import { GET_ALL_CATEGORIES_WITH_PRODUCT_CLIENTS } from './queries';
import { useMemo } from 'react';

/**
 * Custom hook to fetch categories with product data.
 *
 * @param {string} idStore - The ID of the store.
 * @returns {object} - The hook result containing filtered data, loading state, and fetch function.
 */
export const useCatWithProductClient = (idStore) => {
  const { data, loading, error, fetchMore } = useQuery(GET_ALL_CATEGORIES_WITH_PRODUCT_CLIENTS, {
    fetchPolicy: 'cache-and-network',
    variables: {
      max: 100,
      idStore,
      search: '',
      gender: [],
      desc: [],
      categories: [],
    },
  });

  const fetchCategories = () => {
    fetchMore({
      variables: {
        max: 100,
        idStore,
        search: '',
        gender: [],
        desc: [],
        categories: [],
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...prev,
          getCatProductsWithProductClient: fetchMoreResult.getCatProductsWithProductClient,
        };
      },
    });
  };

  // Utiliza useMemo para memorizar el resultado filtrado
  const filteredData = useMemo(() => {
    return data?.getCatProductsWithProductClient?.filter(
      (category) => category?.productFoodsAll?.length > 0
    ) || [];
  }, [data]);

  return [filteredData, {
    loading,
    error,
    fetchCategories,
  }]
};
