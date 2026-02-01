import { useMutation } from '@apollo/client'

import { CATEGORY_EMPTY } from '../../utils/index'
import { useCategoriesProduct } from '../useCategoriesProduct'

import { UPDATE_MULTIPLE_PRODUCTS } from './queries'

interface UpdateMultipleProductResult {
  errors?: { message: string }[];
  // Add other fields as needed
}

interface UpdateMultipleProductsResponse {
  updateMultipleProducts: UpdateMultipleProductResult[];
}

interface UpdateMultipleProductsProps {
  sendNotification?: (notification: Notification) => void;
}

interface Product {
  PRECIO_AL_PUBLICO: number;
  DESCRIPTION: string;
  NAME: string;
  pCode: string;
  QUANTITY?: number;
  'TAX (%)': number;
  BARCODE: string | null;
}

interface Notification {
  backgroundColor: string;
  description: string;
  title: string;
}

export const useUpdateMultipleProducts = ({
  sendNotification = () => {}
}: UpdateMultipleProductsProps): {
    updateProducts: (products: Product[]) => Promise<UpdateMultipleProductResult[]>;
    data: UpdateMultipleProductsResponse | undefined; 
    loading: boolean; 
    error: Error | undefined; 
} => {
  
  const [updateMultipleProducts, {
    data,
    loading,
    error
  }] = useMutation(UPDATE_MULTIPLE_PRODUCTS)

  const [dataCategoriesProducts] = useCategoriesProduct()
  
  const findEmptyCategory = dataCategoriesProducts?.find(({ pName }: { pName: string }) => {return pName === CATEGORY_EMPTY})
  
  const updateProducts = async (products: Product[]): Promise<UpdateMultipleProductResult[]> => {
    
    const newProducts = products.map(product => {
      const {
        PRECIO_AL_PUBLICO: ProPrice,
        DESCRIPTION: ProDescription,
        NAME: pName,
        pCode,
        QUANTITY: stock = 0,
        'TAX (%)': vat,
        BARCODE: ProBarCode
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
    })

    try {
      const response = await updateMultipleProducts({ variables: { input: newProducts } })
      
      for (const { errors } of response.data.updateMultipleProducts) {
        
        if (errors) {
          sendNotification({
            backgroundColor:'error',
            description : errors[0].message ,
            title : 'Error'
          })
        }
      }
      
      return response.data.updateMultipleProducts

    } catch {
      sendNotification({
        backgroundColor:'error',
        description :'An error occurred while updating the products',
        title :'Error'
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