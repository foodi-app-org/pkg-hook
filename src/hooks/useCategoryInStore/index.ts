import { useMutation, useQuery, ApolloError } from '@apollo/client'
import { useState } from 'react'
import {
  DELETE_ONE_CAT_PRODUCTS,
  GET_ULTIMATE_CATEGORY_PRODUCTS,
  UPDATE_CAT_IN_PRODUCT
} from '../useProductsFood/queriesStore'
import { GET_ONE_STORE_IN_CATEGORY } from './queries'

/**
 * Generic alert box handler
 */
interface AlertBoxPayload {
  title?: string
  message: string
  color: 'error' | 'success' | 'warning' | 'info'
}

type SetAlertBox = (payload: AlertBoxPayload) => void

/**
 * Category entity
 */
interface Category {
  idPc: string
  pState: string
  [key: string]: unknown
}

/**
 * Hook params
 */
interface UseCategoryInStoreParams {
  catStoreId?: string
  setAlertBox?: SetAlertBox
}

/**
 * Hook return shape
 */
interface UseCategoryInStoreResult {
  categories: Category[]
  data: Category[]
  loading: boolean
  error?: ApolloError
  handlerDeleteCategoryInStore: (category?: Category) => Promise<unknown> | void
  handleUpdateCatInProduct: (params: { data?: Array<{ pId: string }> }) => Promise<void>
}

/**
 * Custom hook to manage categories in store
 */
export const useCategoryInStore = ({
  catStoreId,
  setAlertBox = () => {}
}: UseCategoryInStoreParams = {}): UseCategoryInStoreResult => {
  const [categories, setOneCategoryInStore] = useState<Category[]>([])

  const [deleteCatOfProducts] = useMutation(DELETE_ONE_CAT_PRODUCTS, {
    onError: (e: ApolloError) => {
      setAlertBox({
        title: '',
        message: e.graphQLErrors?.[0]?.message || 'Unexpected error',
        color: 'error'
      })
    },
    update: (cache) => {
      cache.modify({
        fields: {
          catProductsAll (dataOld = []) {
            return cache.writeQuery({
              query: GET_ULTIMATE_CATEGORY_PRODUCTS,
              data: dataOld
            })
          }
        }
      })
    }
  })

  const [updatedCatWithProducts] = useMutation(UPDATE_CAT_IN_PRODUCT, {
    onError: (e: ApolloError) => {
      console.error({
        message: e.graphQLErrors?.[0]?.message || 'Unexpected error',
        color: 'error'
      })
    },
    update: (cache) => {
      cache.modify({
        fields: {
          catProductsAll (dataOld = []) {
            return cache.writeQuery({
              query: GET_ULTIMATE_CATEGORY_PRODUCTS,
              data: dataOld
            })
          }
        }
      })
    }
  })

  const { data } = useQuery(GET_ULTIMATE_CATEGORY_PRODUCTS)

  const { loading, error } = useQuery(GET_ONE_STORE_IN_CATEGORY, {
    variables: {
      catStore: catStoreId
    },
    skip: !catStoreId,
    onError: () => {
      console.warn({ message: 'Failed loading category store', duration: 5000 })
    },
    onCompleted: (response) => {
      if (response?.getOneCatStore) {
        setOneCategoryInStore(response.getOneCatStore)
      }
    }
  })

  /**
   * Delete category from products
   */
  const handlerDeleteCategoryInStore = (category?: Category) => {
    const { pState, idPc } = category || {}
    if (!idPc || !pState) return

    return deleteCatOfProducts({
      variables: { idPc, pState }
    })
  }

  /**
   * Update category in products
   */
  const handleUpdateCatInProduct = async ({
    data
  }: {
    data?: Array<{ pId: string }>
  }): Promise<void> => {
    if (!data?.length) return

    await updatedCatWithProducts({
      variables: {
        input: {
          setData: data.map(({ pId }) => ({ idProduct: pId })),
          idCat: ''
        }
      }
    })
  }

  return {
    categories,
    data: data?.catProductsAll ?? [],
    loading,
    error,
    handlerDeleteCategoryInStore,
    handleUpdateCatInProduct
  }
}
