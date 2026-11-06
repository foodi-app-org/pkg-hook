import { useMutation, gql } from '@apollo/client'

/**
 * GraphQL mutation to associate an existing tag with a product.
 *
 * The product→tag relationship lives as a `tgId` foreign key on the product,
 * so this mutation updates that FK and returns the updated product.
 */
export const REGISTER_TAG_TO_PRODUCT = gql`
  mutation registerTagToProduct($pId: ID!, $tgId: ID!) {
    registerTagToProduct(pId: $pId, tgId: $tgId) {
      success
      message
      errors {
        path
        message
        type
      }
      data {
        pId
        tgId
        getOneTags {
          tgId
          idUser
          idStore
          pId
          nameTag
          aName
        }
      }
    }
  }
`

/**
 * Error structure returned by the mutation.
 */
interface IRegisterTagToProductError {
  path: string[]
  message: string
  type: string
}

/**
 * Tag associated with the product.
 */
interface IProductTag {
  tgId: string | null
  idUser: string | null
  idStore: string | null
  pId: string | null
  nameTag: string | null
  aName: string | null
}

/**
 * Product returned after associating the tag.
 */
interface IRegisterTagToProductData {
  pId: string | null
  tgId: string | null
  getOneTags: IProductTag | null
}

/**
 * GraphQL response for registerTagToProduct.
 */
interface IResponseRegisterTagToProduct {
  success: boolean
  message: string
  errors: IRegisterTagToProductError[] | null
  data: IRegisterTagToProductData | null
}

/**
 * Arguments to associate a tag with a product.
 */
interface RegisterTagToProductArgs {
  pId: string
  tgId: string
}

/**
 * Options for the useRegisterTagToProduct hook.
 */
interface UseRegisterTagToProductOptions {
  callback?: (response: IResponseRegisterTagToProduct) => void
}

/**
 * Return type for the useRegisterTagToProduct hook.
 */
type UseRegisterTagToProductReturn = [
  (args: RegisterTagToProductArgs) => Promise<IResponseRegisterTagToProduct>,
  {
    loading: boolean
    error: Error | null
    data: IResponseRegisterTagToProduct | null
  }
]

/**
 * Hook to associate an existing tag with a product.
 *
 * @param {UseRegisterTagToProductOptions} [options] - Optional callback invoked with the response.
 * @returns {UseRegisterTagToProductReturn} Handler plus mutation state.
 */
export const useRegisterTagToProduct = (
  { callback = () => {} }: UseRegisterTagToProductOptions = {}
): UseRegisterTagToProductReturn => {
  const [registerTagToProduct, { loading, error, data }] = useMutation<
    { registerTagToProduct: IResponseRegisterTagToProduct },
    RegisterTagToProductArgs
  >(REGISTER_TAG_TO_PRODUCT, {
    onCompleted: (completed) => {
      if (typeof callback === 'function') {
        callback(completed.registerTagToProduct)
      }
    }
  })

  /**
   * Associates the given tag with the given product.
   *
   * @param {RegisterTagToProductArgs} args - Product id and tag id.
   * @returns {Promise<IResponseRegisterTagToProduct>} Mutation response.
   */
  const handleRegisterTagToProduct = async (
    { pId, tgId }: RegisterTagToProductArgs
  ): Promise<IResponseRegisterTagToProduct> => {
    if (!pId || !tgId) {
      return {
        success: false,
        message: 'pId y tgId son requeridos',
        errors: [
          {
            path: ['pId', 'tgId'],
            message: 'pId y tgId son requeridos para asociar el tag',
            type: 'required'
          }
        ],
        data: null
      }
    }

    const response = await registerTagToProduct({
      variables: {
        pId,
        tgId
      }
    })

    return response.data?.registerTagToProduct ?? {
      success: false,
      message: 'No response from server',
      errors: null,
      data: null
    }
  }

  return [
    handleRegisterTagToProduct,
    {
      loading,
      error: error || null,
      data: data?.registerTagToProduct ?? null
    }
  ]
}
