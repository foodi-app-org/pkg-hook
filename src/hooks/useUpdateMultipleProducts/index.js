import { useMutation } from '@apollo/client'
import { UPDATE_MULTIPLE_PRODUCTS } from './queries'
import { CATEGORY_EMPTY } from '../../utils/index'
import { useCategoriesProduct } from '../useCategoriesProduct'

export const useUpdateMultipleProducts = ({
  sendNotification = () => { }
}) => {
  const [updateMultipleProducts, {
    data,
    loading,
    error
  }] = useMutation(UPDATE_MULTIPLE_PRODUCTS)

  const [dataCategoriesProducts] = useCategoriesProduct()
  const findEmptyCategory = dataCategoriesProducts?.find(({ pName }) => pName === CATEGORY_EMPTY)
  const updateProducts = async (products) => {
    const newProducts = products.map(product => {
      const {
        PRECIO_AL_PUBLICO: ProPrice,
        DESCRIPCION: ProDescription,
        NOMBRE: pName,
        pCode,
        CANTIDAD: stock = 0,
        'IMPUESTO (%)': vat,
        CODIGO_DE_BARRAS: ProBarCode
      } = product
      return {
        idStore: '',
        ProPrice,
        ProDescuento: 0,
        ValueDelivery: 0,
        ProDescription,
        pName,
        pCode,
        carProId: findEmptyCategory?.carProId ?? null,
        pState: 1,
        sTateLogistic: 1,
        ProStar: 0,
        stock,
        ProImage: '/images/placeholder-image.webp',
        vat,
        ProBarCode: String(ProBarCode) || '',
        ProHeight: null,
        ProWeight: '',
        ProOutstanding: 0,
        ProDelivery: 0
      }
    }
    )
    try {
      const response = await updateMultipleProducts({ variables: { input: newProducts } })
      // sendNotification
      for (const { errors } of response.data.updateMultipleProducts) {
        if (errors) {
          sendNotification({
            backgroundColor: 'error',
            description: errors[0].message,
            title: 'Error'
          })
        }
      }
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
