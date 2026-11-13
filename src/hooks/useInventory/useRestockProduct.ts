
import {
  gql,
  isReference,
  useApolloClient,
  useMutation,
  ApolloCache,
  FieldFunctionOptions
} from '@apollo/client'
import { useCallback } from 'react'


/* =========================================================
   GRAPHQL MUTATION
========================================================= */

const RESTOCK_PRODUCT = gql`
  mutation RestockProduct($input: InputRestockProduct) {
    restockProduct(input: $input) {
      success
      message
      data {
        pId
        manageStock
        stock
        previousStock
      }
    }
  }
`

/* =========================================================
   TYPES
========================================================= */

export interface RestockProductInput {
  pId: string
  stock: number
}

export interface RestockProductResult {
  success: boolean
  message: string
  data?: {
    pId: string
    manageStock: boolean
    stock: number
    previousStock: number
  } | null
}

interface RestockMutationData {
  restockProduct: RestockProductResult | null
}

interface RestockMutationVariables {
  input: RestockProductInput
}

type RestockedProduct =
  NonNullable<RestockProductResult['data']>

type CacheReadField =
  FieldFunctionOptions['readField']

type CacheNode = Record<string, any>

/* =========================================================
   UPDATE SINGLE PRODUCT IN CACHE
========================================================= */

const updateProductNode = (
  cache: ApolloCache<any>,
  current: CacheNode | null | undefined,
  updated: RestockedProduct,
  readField: CacheReadField
): CacheNode | null | undefined => {
  if (!current || typeof current !== 'object') {
    return current
  }

  const cachedId = isReference(current)
    ? readField<string>('pId', current)
    : current.pId

  if (
    cachedId === null ||
    String(cachedId) !== String(updated.pId)
  ) {
    return current
  }

  /* -----------------------------------------
     NORMALIZED APOLLO ENTITY
  ----------------------------------------- */

  if (isReference(current)) {
    cache.modify({
      id: current.__ref,
      fields: {
        stock: () => updated.stock,
        manageStock: () => updated.manageStock,
        previousStock: () => updated.previousStock
      }
    })

    return current
  }

  /* -----------------------------------------
     EMBEDDED PRODUCT OBJECT
  ----------------------------------------- */

  if (
    current.stock === updated.stock &&
    current.manageStock === updated.manageStock &&
    current.previousStock === updated.previousStock
  ) {
    return current
  }

  return {
    ...current,
    stock: updated.stock,
    manageStock: updated.manageStock,
    previousStock: updated.previousStock
  }
}

/* =========================================================
   UPDATE PRODUCT LIST
========================================================= */
const updateProductList = (
  cache: ApolloCache<any>,
  products: any,
  updated: RestockedProduct,
  readField: CacheReadField
): any => {
  if (!Array.isArray(products)) {
    return products
  }

  let changed = false

  const next = products.map((product) => {
    const nextProduct = updateProductNode(
      cache,
      product,
      updated,
      readField
    )

    if (nextProduct !== product) {
      changed = true
    }

    return nextProduct
  })

  return changed ? next : products
}

/* =========================================================
   UPDATE NESTED CACHE FIELD
========================================================= */

const updateNodeField = (
  cache: ApolloCache<any>,
  node: any,
  fieldName: string,
  updateValue: (value: any) => any
): any => {
  if (!node || typeof node !== 'object') {
    return node
  }

  if (isReference(node)) {
    cache.modify({
      id: node.__ref,
      fields: {
        [fieldName]: (current: any) =>
          updateValue(current)
      }
    })

    return node
  }

  const existing = node[fieldName]
  const next = updateValue(existing)

  if (next === existing) {
    return node
  }

  return {
    ...node,
    [fieldName]: next
  }
}

/* =========================================================
   UPDATE ALL PRODUCT CACHE VARIANTS
========================================================= */

/**
 * Actualiza las entradas existentes en ROOT_QUERY.
 *
 * Apollo puede almacenar múltiples variantes:
 *
 * productFoodsAll({"search":"cafe"})
 * productFoodsAll({"search":"arroz"})
 * productFoodsAll({"max":20})
 *
 * cache.modify permite afectar todas las variantes
 * mediante el nombre base del campo.
 * @param cache
 * @param updated
 */
const updateStockInApolloCache = (
  cache: ApolloCache<any>,
  updated: RestockedProduct
): void => {
  cache.modify({
    id: 'ROOT_QUERY',
    fields: {
      /* -----------------------------------------
         MAIN PRODUCTS LIST
         useProductsFood
      ----------------------------------------- */

      productFoodsAll(existing, { readField }) {
        return updateNodeField(
          cache,
          existing,
          'data',
          (products) =>
            updateProductList(
              cache,
              products,
              updated,
              readField
            )
        )
      },

      /* -----------------------------------------
         SINGLE PRODUCT
         useGetOneProductsFood
      ----------------------------------------- */

      productFoodsOne(existing, { readField }) {
        return updateProductNode(
          cache,
          existing,
          updated,
          readField
        )
      },

      /* -----------------------------------------
         CATEGORY PRODUCT LIST
         GET_ALL_CATEGORIES_WITH_PRODUCT
      ----------------------------------------- */

      getCatProductsWithProduct(
        existing,
        { readField }
      ) {
        if (!Array.isArray(existing)) {
          return existing
        }

        let changed = false

        const next = existing.map((category) => {
          const nextCategory = updateNodeField(
            cache,
            category,
            'productFoodsAll',
            (products) =>
              updateProductList(
                cache,
                products,
                updated,
                readField
              )
          )

          if (nextCategory !== category) {
            changed = true
          }

          return nextCategory
        })

        return changed ? next : existing
      },

      /* -----------------------------------------
         BARCODE SEARCH
         useFindProductByBarcode
      ----------------------------------------- */

      findProductByBarcode(
        existing,
        { readField }
      ) {
        return updateNodeField(
          cache,
          existing,
          'data',
          (product) =>
            updateProductNode(
              cache,
              product,
              updated,
              readField
            )
        )
      }
    }
  })
}

/* =========================================================
   USE RESTOCK PRODUCT
========================================================= */

export const useRestockProduct = () => {
  const client = useApolloClient()

  const [
    restockProductMutation,
    {
      data,
      loading,
      error
    }
  ] = useMutation<
    RestockMutationData,
    RestockMutationVariables
  >(RESTOCK_PRODUCT)

  const restockProduct = useCallback(
    async (
      input: RestockProductInput
    ): Promise<RestockProductResult> => {
      try {
        /* -----------------------------------------
           1. EXECUTE BACKEND MUTATION
        ----------------------------------------- */

        const response = await restockProductMutation({
          variables: {
            input
          },
          errorPolicy: 'none'
        })

        const result = response.data?.restockProduct

        if (!result) {
          return {
            success: false,
            message:
              'El servidor no confirmó el restablecimiento del stock.',
            data: null
          }
        }

        /* -----------------------------------------
           2. VALIDATE BACKEND RESPONSE
        ----------------------------------------- */

        if (
          result.success &&
          result.data?.pId &&
          typeof result.data.stock === 'number' &&
          Number.isFinite(result.data.stock)
        ) {
          const updated = result.data

          /* -----------------------------------------
             3. UPDATE APOLLO CACHE
          ----------------------------------------- */

          try {
            client.cache.batch({
              update(cache) {
                updateStockInApolloCache(
                  cache,
                  updated
                )
              }
            })
          } catch (cacheError) {
            console.error(
              'useRestockProduct: error actualizando caché',
              cacheError
            )

            /* -----------------------------------------
               4. FALLBACK: REFETCH ACTIVE QUERIES
            ----------------------------------------- */

            try {
              await client.refetchQueries({
                include: [
                  'productFoodsAll',
                  'productFoodsOne',
                  'getCatProductsWithProduct',
                  'findProductByBarcode'
                ]
              })
            } catch (refetchError) {
              console.error(
                'useRestockProduct: error en refetch de respaldo',
                refetchError
              )
            }
          }
        }

        /* -----------------------------------------
           5. RETURN ORIGINAL BACKEND RESPONSE
        ----------------------------------------- */

        return result
      } catch (err) {
        return {
          success: false,
          message:
            err instanceof Error
              ? err.message
              : 'An unknown error occurred',
          data: null
        }
      }
    },
    [
      client,
      restockProductMutation
    ]
  )

  return [
    restockProduct,
    {
      data,
      loading,
      error
    }
  ] as const
}
