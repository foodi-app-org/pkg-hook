import { Product, SendNotificationFn } from 'typesdefs'

import { SalesReducerAction } from '../types';

import { SalesActionTypes } from './constants';

interface HandleAddProductParams {
    product: Product | null;
    productsFood: Product[];
    handleGetOneProduct: ({ pId }: { pId: string }) => Promise<{
        data: {
            productFoodsOne: Product | null;
        };
    }>;
    sendNotification: SendNotificationFn;
    dispatch: React.Dispatch<SalesReducerAction>;
}

export const handleAddProduct = async ({
    product,
    productsFood,
    handleGetOneProduct,
    sendNotification,
    dispatch
}: HandleAddProductParams) => {
    const pId = String(product?.pId)
    const memo = productsFood.find((item: Product) => { return String(item.pId) === pId })
    if (!memo) {
        const response = await handleGetOneProduct({ pId })
        if (response.data?.productFoodsOne === null) {
            return sendNotification({
                title: 'Error',
                backgroundColor: 'error',
                description: 'No se pudo obtener el producto'
            })
        }
        const productData = response.data?.productFoodsOne ?? { pId: null }
        return dispatch({
            type: SalesActionTypes.ADD_TO_CART,
            payload: productData
        })
    }
    return dispatch({
        type: SalesActionTypes.ADD_TO_CART,
        payload: memo
    })
}