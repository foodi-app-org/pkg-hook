import { useMutation, ApolloError } from '@apollo/client'
import type { ApolloCache } from '@apollo/client'

import { UPDATE_PRODUCT_CATEGORY } from './queries'

import type { SendNotificationFn } from 'typesdefs'

/** Minimal shape of a product inside `productFoodsAll`. */
type CachedProduct = {
  pId?: string
  carProId?: string
  [key: string]: unknown
}

/** Minimal shape of a category inside `catProductsWithProduct`. */
type CachedCategory = {
  carProId?: string
  totalCount?: number
  productFoodsAll?: CachedProduct[] | null
  [key: string]: unknown
}

/** Shape of the cached `getCatProductsWithProduct` field value. */
type CachedCatWithProduct = {
  totalCount?: number
  catProductsWithProduct?: CachedCategory[] | null
  [key: string]: unknown
}

/**
 * Moves a product between categories inside a cached `getCatProductsWithProduct`
 * value, so the UI reflects the new category without refetching.
 *
 * - Finds the product (by `pId`) in any category's `productFoodsAll`.
 * - Removes it from its current category and appends it to the target one
 *   (`toCarProId`), updating its own `carProId`.
 * - Keeps each category `totalCount` in sync when present.
 *
 * Returns a NEW object (never mutates the cached one) so Apollo detects the
 * change and notifies active watchers. If nothing changes, returns `existing`.
 * @param existing - Current cached field value.
 * @param pId - Product id being moved.
 * @param toCarProId - Target category id.
 * @returns The updated (or unchanged) field value.
 */
const moveProductBetweenCategories = (
  existing: CachedCatWithProduct | undefined,
  pId: string,
  toCarProId: string
): CachedCatWithProduct | undefined => {
  const categories = existing?.catProductsWithProduct
  if (!existing || !Array.isArray(categories)) {
    return existing
  }

  // Locate the product and its current category.
  let movingProduct: CachedProduct | undefined
  for (const category of categories) {
    const found = category?.productFoodsAll?.find((product) => {
      return product?.pId === pId
    })
    if (found) {
      movingProduct = found
      break
    }
  }

  // Nothing to move (product not cached yet, or already in target with no copy
  // elsewhere). Fall through to the rebuild which is a no-op in that case.
  const updatedProduct: CachedProduct = {
    ...(movingProduct ?? { pId }),
    carProId: toCarProId
  }

  let changed = false

  const nextCategories = categories.map((category) => {
    const list = Array.isArray(category?.productFoodsAll)
      ? category.productFoodsAll
      : []
    const isTarget = category?.carProId === toCarProId
    const hasProduct = list.some((product) => {
      return product?.pId === pId
    })

    // Remove the product from every non-target category that holds it.
    if (!isTarget && hasProduct) {
      changed = true
      const filtered = list.filter((product) => {
        return product?.pId !== pId
      })
      return {
        ...category,
        productFoodsAll: filtered,
        ...(typeof category.totalCount === 'number'
          ? { totalCount: Math.max(0, category.totalCount - 1) }
          : {})
      }
    }

    // Add (or refresh) the product in the target category.
    if (isTarget) {
      if (hasProduct) {
        // Already there: just refresh its data/carProId.
        return {
          ...category,
          productFoodsAll: list.map((product) => {
            return product?.pId === pId ? updatedProduct : product
          })
        }
      }
      changed = true
      return {
        ...category,
        productFoodsAll: [...list, updatedProduct],
        ...(typeof category.totalCount === 'number'
          ? { totalCount: category.totalCount + 1 }
          : {})
      }
    }

    return category
  })

  if (!changed) {
    return existing
  }

  return {
    ...existing,
    catProductsWithProduct: nextCategories
  }
}

/**
 * Apollo `update` handler that moves the product to its new category across all
 * cached `getCatProductsWithProduct` entries (regardless of their variables).
 * @param cache - Apollo cache instance.
 * @param pId - Product id being moved.
 * @param carProId - Target category id.
 */
const updateCatWithProductCache = (
  cache: ApolloCache<unknown>,
  pId: string,
  carProId: string
): void => {
  cache.modify({
    fields: {
      getCatProductsWithProduct(existing: CachedCatWithProduct | undefined) {
        return moveProductBetweenCategories(existing, pId, carProId)
      }
    }
  })
}

/** Shape of each GraphQL field error returned by the mutation. */
export interface UpdateProductCategoryError {
  path?: string
  message?: string
  type?: string
}

/** Normalized result of the `updateProductCategory` mutation. */
export interface UpdateProductCategoryResult {
  success: boolean
  message: string
  data?: {
    pId?: string
    carProId?: string
  } | null
  errors?: UpdateProductCategoryError[]
}

/** Variables accepted by the easy-to-use updater function. */
export interface UpdateProductCategoryInput {
  /** Product id whose category will be updated. */
  pId: string
  /** Category id (`carProId`) to assign to the product. */
  carProId: string
}

interface UseUpdateProductCategoryOptions {
  /** Optional notifier for success/error feedback. */
  sendNotification?: SendNotificationFn
  /** Called with the result after a successful update. */
  onSuccess?: (result: UpdateProductCategoryResult) => void
}

/**
 * useUpdateProductCategory
 *
 * Easy-to-use hook to update the category of a product. It wraps the
 * `updateProductCategory(pId, carProId)` backend mutation and returns a simple
 * async function plus the current request state. Success/error notifications
 * are raised automatically when a `sendNotification` is provided.
 *
 * @example
 * const { updateProductCategory, loading } = useUpdateProductCategory({ sendNotification })
 * await updateProductCategory({ pId, carProId })
 *
 * @param {UseUpdateProductCategoryOptions} [options] - Hook options.
 * @param options.sendNotification - Notifier used for success/error feedback.
 * @param options.onSuccess - Callback invoked after a successful update.
 * @returns An object with `updateProductCategory`, `loading`, `error` and `data`.
 */
export const useUpdateProductCategory = ({
  sendNotification = () => {},
  onSuccess = () => {}
}: UseUpdateProductCategoryOptions = {}) => {
  const [mutate, { loading, error, data }] = useMutation(UPDATE_PRODUCT_CATEGORY, {
    onError: (err: ApolloError) => {
      sendNotification({
        title: 'Error',
        description: err.message ?? 'Error al actualizar la categoría del producto',
        backgroundColor: 'error'
      })
    }
  })

  /**
   * Updates the product's category.
   * @param {UpdateProductCategoryInput} input - { pId, carProId }.
   * @returns {Promise<UpdateProductCategoryResult>} Normalized result.
   */
  const updateProductCategory = async ({
    pId,
    carProId
  }: UpdateProductCategoryInput): Promise<UpdateProductCategoryResult> => {
    if (!pId || !carProId) {
      const result: UpdateProductCategoryResult = {
        success: false,
        message: 'pId y carProId son requeridos'
      }
      sendNotification({
        title: 'Error',
        description: result.message,
        backgroundColor: 'error'
      })
      return result
    }

    try {
      const response = await mutate({
        variables: { pId, carProId },
        // Let Apollo's cache "do its magic": once the server confirms the
        // change, move the product into its new category across every cached
        // `getCatProductsWithProduct` entry so active views update instantly
        // without a network refetch.
        update: (
          cache: ApolloCache<unknown>,
          { data: mutationData }: { data?: { updateProductCategory?: UpdateProductCategoryResult } | null }
        ) => {
          const ok = mutationData?.updateProductCategory?.success
          if (!ok) return
          updateCatWithProductCache(cache, pId, carProId)
        }
      })
      const result: UpdateProductCategoryResult = response?.data?.updateProductCategory ?? {
        success: false,
        message: 'No se pudo actualizar la categoría del producto'
      }

      if (result.success) {
        sendNotification({
          title: 'Éxito',
          description: result.message || 'Categoría actualizada correctamente',
          backgroundColor: 'success'
        })
        onSuccess(result)
      } else {
        sendNotification({
          title: 'Error',
          description:
            result.errors?.map((e) => e?.message).filter(Boolean).join(' ') ||
            result.message ||
            'No se pudo actualizar la categoría del producto',
          backgroundColor: 'error'
        })
      }

      return result
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error inesperado al actualizar la categoría'
      return { success: false, message }
    }
  }

  return { updateProductCategory, loading, error, data }
}
