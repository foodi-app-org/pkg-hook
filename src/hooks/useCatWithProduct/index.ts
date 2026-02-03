import { useQuery, ApolloError, ApolloQueryResult } from '@apollo/client'

import { GET_ALL_CATEGORIES_WITH_PRODUCT } from './queries'
import { GetCatProductsWithProductResponse, ICatWithProduct } from './types'

/**
 * Query variables for GET_ALL_CATEGORIES_WITH_PRODUCT
 */
type GetCatProductsWithProductVars = {
  search?: string | null
  productName?: string | null
  gender?: Array<string | number>
  min?: number
  max?: number
  desc?: string | null
  categories?: Array<string | number>
}

/**
 * Hook to fetch categories with products.
 *
 * @param options - Partial options for the hook (defaults are applied)
 * @returns tuple: [catProductsWithProduct[], { loading, error, fetchMore, totalCount }]
 */
export const useCatWithProduct = (
  options: Partial<ICatWithProduct> = {}
): [
  ICatWithProduct[] | undefined,
  {
    loading: boolean
    error?: ApolloError | null
    fetchMore: (opts?: any) => Promise<ApolloQueryResult<GetCatProductsWithProductResponse>>
    totalCount?: number
  }
] => {
  const {
    max = 400,
    min = 0,
    search = null,
    productName = null,
    searchFilter = {},
    callback = () => {}
  } = options

  const { gender = [], desc = null, speciality = [] } = searchFilter ?? {
    gender: [],
    desc: null,
    speciality: []
  }

  const { data, loading, error, fetchMore } = useQuery<
    GetCatProductsWithProductResponse,
    GetCatProductsWithProductVars
  >(GET_ALL_CATEGORIES_WITH_PRODUCT, {
    onCompleted: (resp) => {
      callback(resp)
    },
    fetchPolicy: 'network-only',
    variables: {
      search,
      productName,
      gender,
      min,
      max,
      desc,
      categories: speciality
    }
  })

  const totalCount = data?.getCatProductsWithProduct?.totalCount

  return [
    data?.getCatProductsWithProduct?.catProductsWithProduct as ICatWithProduct[] | undefined,
    {
      loading,
      error,
      fetchMore,
      totalCount
    }
  ]
}
