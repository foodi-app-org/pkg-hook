import { SalesState } from "../../types";
import { TypeDiscount } from "../apply-discount-to-cart.utils";

export enum SalesActionTypes {
    ADD_TO_CART = 'ADD_TO_CART',
    ADD_PRODUCT = 'ADD_PRODUCT',
    REMOVE_PRODUCT = 'REMOVE_PRODUCT',
    REMOVE_PRODUCT_TO_CART = 'REMOVE_PRODUCT_TO_CART',
    ON_CHANGE = 'ON_CHANGE',
    UPDATE_SUCCESS_QUANTITY_EDITING_PRODUCT = 'UPDATE_SUCCESS_QUANTITY_EDITING_PRODUCT',
    CANCEL_UPDATE_QUANTITY_EDITING_PRODUCT = 'CANCEL_UPDATE_QUANTITY_EDITING_PRODUCT',
    REMOVE_ALL_PRODUCTS = 'REMOVE_ALL_PRODUCTS',
    TOGGLE_FREE_PRODUCT = 'TOGGLE_FREE_PRODUCT',
    TOGGLE_EDITING_PRODUCT = 'TOGGLE_EDITING_PRODUCT',
    INCREMENT = 'INCREMENT',
    DECREMENT = 'DECREMENT',
    PUT_COMMENT = 'PUT_COMMENT',
    PUT_EXTRA_PRODUCTS_AND_OPTIONAL_PRODUCT = 'PUT_EXTRA_PRODUCTS_AND_OPTIONAL_PRODUCT',
    PRICE_RANGE = 'PRICE_RANGE',
    SORT = 'SORT',
    PAYMENT_METHOD = 'PAYMENT_METHOD',
    APPLY_DISCOUNT = 'APPLY_DISCOUNT'
}
export const initialStateSales: SalesState = {
    animateType: '',
    counter: 0,
    discountAmount: 0,
    discountPercent: 0,
    discountType: TypeDiscount.PERCENT,
    itemsInCart: 0,
    payId: '',
    priceRange: 0,
    PRODUCT: [],
    sortBy: null,
    startAnimateUp: '',
    totalAmount: 0,
    totalPrice: 0,
}
