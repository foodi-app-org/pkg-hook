import { useMutation } from '@apollo/client'
import { UPDATE_MULTIPLE_PRODUCTS } from './queries'
import { CATEGORY_EMPTY, RandomCode } from '../../utils/index'
import { useCategoriesProduct } from '../useCategoriesProduct'

export const useUpdateMultipleProducts = ({
  sendNotification = () => { }
}) => {
  const [updateMultipleProducts, { data, loading, error }] = useMutation(UPDATE_MULTIPLE_PRODUCTS)
  const [dataCategoriesProducts] = useCategoriesProduct()
  const findEmptyCategory = dataCategoriesProducts?.find(category => category.pName === CATEGORY_EMPTY)
  const updateProducts = async (products) => {
    const newProducts = products.map(product => {
      const code = RandomCode(9)
      return {
        idStore: '',
        ProPrice: product.PRECIO_AL_PUBLICO,
        ProDescuento: 0,
        ValueDelivery: 0,
        ProDescription: product.DESCRIPCION,
        pName: product.NOMBRE,
        pCode: code,
        carProId: findEmptyCategory?.carProId ?? null,
        pState: 1,
        sTateLogistic: 1,
        ProStar: 0,
        ProImage: 'https:http://localhost:8080',
        ProHeight: null,
        ProWeight: '',
        ProOutstanding: 0,
        ProDelivery: 0
      }
    }
    )
    try {
      const response = await updateMultipleProducts({ variables: { input: newProducts } })
      return response.data.updateMultipleProducts
    } catch (e) {
      sendNotification({
        backgroundColor: 'error',
        description: 'Ocurrió un error al actualizar los productos',
        title: 'Error'
      })
      return []
    }
  }

  return {
    updateProducts,
    data,
    loading,
    error
  }
}
