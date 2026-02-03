import { SalesReducerAction, SalesState } from '../types'

import type { Product, SendNotificationFn } from 'typesdefs'


/**
 * handleChangeNumber
 * Updates product quantity from input change with full validations.
 * @param {any} state - Current reducer state
 * @param {any} action - Action with payload { value, index, id }
 * @param {any[]} productsFood - Products memory source
 * @param {(n:{title:string,backgroundColor:string,description?:string})=>void} sendNotification
 * @param {(a:any)=>void} dispatch
 * @returns {any} Updated state
 */
function getEventFromAction(action: SalesReducerAction) {
    return ('payload' in action && action.payload) ? action.payload : {};
}

/**
 *
 * @param products
 * @param id
 * @returns found product or undefined
 */
function findProductById(products: Product[], id: string) {
    return products.find((item: Product) => item.pId === id);
}

/**
 *
 * @param sendNotification
 */
function notifyNoStock(sendNotification: SendNotificationFn) {
    sendNotification({
        title: 'Sin stock',
        backgroundColor: 'warning',
        description: 'Producto sin stock disponible'
    });
}

/**
 *
 * @param sendNotification
 * @param productName
 */
function notifyProductRemoved(sendNotification: SendNotificationFn, productName: string) {
    sendNotification({
        title: 'Producto eliminado',
        backgroundColor: 'info',
        description: `Has eliminado ${productName} del carrito.`
    });
}

/**
 *
 * @param sendNotification
 * @param productName
 * @param stock
 */
function notifyStockExceeded(sendNotification: SendNotificationFn, productName: string, stock: number) {
    sendNotification({
        title: 'Stock insuficiente',
        backgroundColor: 'warning',
        description: `No puedes agregar más unidades de ${productName}. Stock disponible: ${stock}`
    });
}

/**
 *
 * @param products
 * @param index
 * @param finalQuantity
 * @param productExist
 * @returns updated products list
 */
function updateProductsList(products: Product[], index: number, finalQuantity: number, productExist: Product) {
    return products.map((item: Product, i: number) => {
        return i === index
            ? {
                ...item,
                ProQuantity: finalQuantity,
                ProPrice: finalQuantity * (productExist.ProPrice ?? 0)
            }
            : item;
    });
}

/**
 *
 * @param event
 * @param state
 * @param productsFood
 * @returns whether to return early
 */
function shouldReturnEarly(event: any, state: SalesState, productsFood: Product[]) {
    const { index, id } = event;
    if (!id || index === undefined) return true;
    const productExist = findProductById(productsFood, id);
    const oneProduct = findProductById(state?.PRODUCT ?? [], id);
    if (!productExist || !oneProduct) return true;
    return false;
}

/**
 *
 * @param productExist
 * @param sendNotification
 * @param state
 * @returns updated state or null
 */
function handleNoStock(productExist: Product, sendNotification: SendNotificationFn, state: SalesState) {
    if (productExist.stock === 0) {
        notifyNoStock(sendNotification);
        return state;
    }
    return null;
}
/**
 * Handles the removal of a product from the cart if the value is less than or equal to zero.
 * @param {Object} params - The parameters object.
 * @param {number} params.value - The new quantity value.
 * @param {SendNotificationFn} params.sendNotification - Function to send notifications.
 * @param {Product} params.oneProduct - The product to potentially remove.
 * @param {SalesState} params.state - The current sales state.
 * @param {string} params.id - The product ID.
 * @returns {SalesState | null} The updated state if the product is removed, otherwise null.
 */
function handleRemoveProduct({
    value,
    sendNotification,
    oneProduct,
    state,
    id
}: {
    value: number,
    sendNotification: SendNotificationFn,
    oneProduct: Product,
    state: SalesState,
    id: string
}) {
    if (value <= 0) {
        notifyProductRemoved(sendNotification, oneProduct.pName);
        return {
            ...state,
            PRODUCT: state.PRODUCT.filter((t: Product) => t.pId !== id),
            counter: (state.counter ?? 0) - (oneProduct.ProQuantity || 0)
        };
    }
    return null;
}

/**
 *
 * @param productExist
 * @param value
 * @returns final quantity
 */
function getFinalQuantity(productExist: Product, value: any) {
    const safeValue = Number(value) || 0;
    const maxStock = productExist.manageStock ? productExist.stock : safeValue;
    return Math.min(safeValue, maxStock);
}

/**
 *
 * @param safeValue
 * @param productExist
 * @param sendNotification
 * @param oneProduct
 */
function handleStockExceeded(safeValue: number, productExist: Product, sendNotification: SendNotificationFn, oneProduct: Product) {
    if (safeValue > productExist.stock && productExist.manageStock) {
        notifyStockExceeded(sendNotification, oneProduct.pName, productExist.stock);
    }
}

export const handleChangeNumber = (
    state: SalesState,
    action: SalesReducerAction,
    productsFood: Product[] = [],
    sendNotification: SendNotificationFn,
) => {
    const event = getEventFromAction(action);
    const { value, index, id } = event;

    if (shouldReturnEarly(event, state, productsFood)) return state;

    const productExist = findProductById(productsFood, id);
    const oneProduct = findProductById(state?.PRODUCT ?? [], id);

    const noStockResult = handleNoStock(productExist!, sendNotification, state);
    if (noStockResult) return noStockResult;

    const removeProductResult = handleRemoveProduct({
        value,
        sendNotification,
        oneProduct: oneProduct!,
        state,
        id
    });
    if (removeProductResult) return removeProductResult;

    const safeValue = Number(value) || 0;
    const finalQuantity = getFinalQuantity(productExist!, value);

    handleStockExceeded(safeValue, productExist!, sendNotification, oneProduct!);

    const updatedProducts = updateProductsList(state.PRODUCT, index, finalQuantity, productExist!);

    return {
        ...state,
        PRODUCT: updatedProducts,
        counter: (state.counter ?? 0) + 1
    };
}