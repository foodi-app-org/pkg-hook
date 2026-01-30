import { gql, useMutation } from '@apollo/client'

const EDIT_CATEGORY_PRODUCT = gql`
  mutation EditOneCategoryProduct($pName: String!, $ProDescription: String, $carProId: ID!) {
    editOneCategoryProduct(pName: $pName, ProDescription: $ProDescription, carProId: $carProId) {
      success
      message
    }
  }
`

export const useEditCategoryProduct = ({ sendNotification = () => { } } = {}) => {
  const [editCategoryProductMutation] = useMutation(EDIT_CATEGORY_PRODUCT)

  const editCategoryProduct = async (pName, ProDescription, carProId) => {
    try {
      const { data } = await editCategoryProductMutation({
        variables: { pName, ProDescription, carProId }
      })

      if (data.editOneCategoryProduct.success) {
        return {
          success: true,
          message: 'Categoría de producto editada correctamente'
        }
      } 
      return {
        success: false,
        message: data.editOneCategoryProduct.message || 'Error al editar la categoría de producto'
      }
      
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al editar la categoría de producto'
      }
    }
  }

  return { editCategoryProduct }
}
