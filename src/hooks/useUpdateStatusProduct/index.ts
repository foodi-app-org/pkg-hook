
import { gql, useMutation } from '@apollo/client'
import { useCallback } from 'react'

/**
 * Estados permitidos para los productos.
 */
export enum ProductStatus {
  ACTIVE = 1,
  INACTIVE = 0,
  ARCHIVED = -1
}

export interface UpdateStatusProductInput {
  pId: string
  pState: ProductStatus
}

export interface UpdateStatusProductData {
  pId: string
  pName?: string | null
  pState: number
}

export interface UpdateStatusProductResponse {
  success: boolean
  message: string
  data: UpdateStatusProductData | null
}

interface UpdateStatusProductMutation {
  updateStatusProduct: UpdateStatusProductResponse | null
}

interface UpdateStatusProductVariables {
  pId: string
  pState: ProductStatus
}

/**
 * GraphQL mutation.
 */
export const UPDATE_STATUS_PRODUCT = gql`
  mutation UpdateStatusProduct(
    $pId: ID!
    $pState: Int
  ) {
    updateStatusProduct(
      pId: $pId
      pState: $pState
    ) {
      success
      message
      data {
        pId
        pName
        pState
      }
    }
  }
`

export const useUpdateStatusProduct = () => {
  const [
    mutate,
    {
      data,
      loading,
      error,
      reset
    }
  ] = useMutation<
    UpdateStatusProductMutation,
    UpdateStatusProductVariables
  >(UPDATE_STATUS_PRODUCT)

  /**
   * Execute product status update.
   */
  const updateStatusProduct = useCallback(
    async (
      input: UpdateStatusProductInput
    ): Promise<UpdateStatusProductResponse | null> => {
      const { pId, pState } = input

      if (!pId) {
        throw new Error('El identificador del producto es requerido')
      }

      const result = await mutate({
        variables: {
          pId,
          pState
        }
      })

      const response = result.data?.updateStatusProduct

      if (!response) {
        throw new Error('No se recibió respuesta al actualizar el producto')
      }

      return response
    },
    [mutate]
  )

  return [updateStatusProduct, {
    data: data?.updateStatusProduct ?? null,
    loading,
    error,
    reset
  }]
}

export default useUpdateStatusProduct
