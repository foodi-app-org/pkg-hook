
'use client'

import {
  useApolloClient,
  useMutation
} from '@apollo/client'
import { useCallback, useRef } from 'react'

import { GET_ALL_CATEGORIES_WITH_PRODUCT } from '../useCatWithProduct/queries'
import { GET_ULTIMATE_CATEGORY_PRODUCTS } from '../useProductsFood/queriesStore'

import { CREATE_CATEGORY_PRODUCT } from './queries'

import type {
  ApolloError,
  DocumentNode
} from '@apollo/client'

/**
 * Input for creating a product category.
 */
export interface CreateCategoryProductInput {
  pName: string
  ProDescription?: string
}

/**
 * Backend response.
 */
export interface CreateCategoryProductResponse {
  success: boolean
  message: string
}

interface MutationData {
  updatedProducts: CreateCategoryProductResponse | null
}

interface MutationVariables {
  input: CreateCategoryProductInput
}

/**
 * Categories queries to refresh after creation.
 *
 * A DocumentNode is preferable to an operation name
 * because it avoids name mismatches.
 */
export interface UseCreateCategoryProductOptions {
  onSuccess?: (
    result: CreateCategoryProductResponse
  ) => void

  onError?: (error: Error) => void

  /**
   * Called when the category was created,
   * but one or more queries could not be refreshed.
   */
  onRefetchError?: (error: Error) => void

  /**
   * Enables automatic query refreshing.
   * @default true
   */
  refetchAfterCreate?: boolean

  /**
   * Additional GraphQL queries to refresh.
   */
  additionalRefetchQueries?: DocumentNode[]

  /**
   * Operation names to refresh.
   * Useful for the paginated query if its
   * DocumentNode is not imported directly.
   */
  refetchQueryNames?: string[]
}

/**
 * Shared operation names from the pagination module.
 *
 * Keep only the actual operation name once confirmed.
 */
const PAGINATED_QUERY_NAMES = [
  'CatProductsPaginated',
  'CategoryProductsPaginated'
]

/**
 * Queries used across the categories module.
 */
const CATEGORY_QUERIES: DocumentNode[] = [
  GET_ULTIMATE_CATEGORY_PRODUCTS,
  GET_ALL_CATEGORIES_WITH_PRODUCT
]

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error
  }

  return new Error(
    'Ocurrió un error inesperado al crear la categoría.'
  )
}


export const useCreateCategoryProduct = ({
  onSuccess,
  onError,
  onRefetchError,
  refetchAfterCreate = true,
  additionalRefetchQueries,
  refetchQueryNames = PAGINATED_QUERY_NAMES
}: UseCreateCategoryProductOptions = {}) => {
  const client = useApolloClient()

  const submitting = useRef(false)

  const [
    mutate,
    {
      loading,
      error,
      reset
    }
  ] = useMutation<
    MutationData,
    MutationVariables
  >(CREATE_CATEGORY_PRODUCT)

  /**
   * Refreshes the active category queries.
   *
   * Apollo refetches matching active ObservableQueries,
   * including queries with different variables.
   */
  const refreshCategories = useCallback(
    async (): Promise<void> => {
      const queries = [
        ...CATEGORY_QUERIES,
        ...(additionalRefetchQueries ?? []),
        ...refetchQueryNames
      ]

      // Remove duplicated document/name references.
      const uniqueQueries = [...new Set(queries)]

      if (uniqueQueries.length === 0) {
        return
      }

      await client.refetchQueries({
        include: uniqueQueries
      })
    },
    [
      client,
      additionalRefetchQueries,
      refetchQueryNames
    ]
  )

  /**
   * Creates a new product category.
   */
  const createCategory = useCallback(
    async (
      input: CreateCategoryProductInput
    ): Promise<CreateCategoryProductResponse> => {
      if (submitting.current) {
        throw new Error(
          'Ya hay una creación de categoría en proceso.'
        )
      }

      submitting.current = true

      try {
        const pName =
          typeof input.pName === 'string'
            ? input.pName.trim().replace(/\s+/g, ' ')
            : ''

        const ProDescription =
          typeof input.ProDescription === 'string'
            ? input.ProDescription.trim()
            : ''

        if (
          pName.length < 2 ||
          pName.length > 120
        ) {
          throw new Error(
            'El nombre debe tener entre 2 y 120 caracteres.'
          )
        }

        if (ProDescription.length > 1000) {
          throw new Error(
            'La descripción no puede superar los 1000 caracteres.'
          )
        }

        const response = await mutate({
          variables: {
            input: {
              pName,
              ProDescription
            }
          },
          errorPolicy: 'none'
        })

        const result = response.data?.updatedProducts

        if (!result) {
          throw new Error(
            'El servidor no devolvió una respuesta válida.'
          )
        }

        if (!result.success) {
          throw new Error(
            result.message ||
              'No fue posible crear la categoría.'
          )
        }

        /**
         * Creation succeeded.
         *
         * A refetch failure must not be interpreted
         * as a failed creation.
         */
        if (refetchAfterCreate) {
          try {
            await refreshCategories()
          } catch (refetchError) {
            const normalized = normalizeError(refetchError)

            console.error(
              '[useCreateCategoryProduct] ' +
                'La categoría fue creada, pero falló ' +
                'la actualización de las listas:',
              normalized
            )

            onRefetchError?.(normalized)
          }
        }

        onSuccess?.(result)

        return result
      } catch (cause) {
        const normalized = normalizeError(cause)

        onError?.(normalized)

        throw normalized
      } finally {
        // eslint-disable-next-line require-atomic-updates
        submitting.current = false
      }
    },
    [
      mutate,
      refetchAfterCreate,
      refreshCategories,
      onSuccess,
      onError,
      onRefetchError
    ]
  )

  return {
    createCategory,
    refreshCategories,
    loading,
    error: error as ApolloError | undefined,
    reset
  }
}
