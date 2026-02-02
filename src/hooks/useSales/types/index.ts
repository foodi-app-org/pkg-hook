import type { Product } from 'typesdefs'

import { TypeDiscount } from '../helpers/apply-discount-to-cart.utils'
import { SalesActionTypes } from '../helpers/constants'
/**
 * Basic notification payload used across hook
 */
export interface NotificationPayload {
  title?: string
  description?: string
  backgroundColor?: 'success' | 'error' | 'warning' | 'info'
}

export interface SalesState {
    PRODUCT: Product[];
    totalPrice: number;
    sortBy: string | null;
    itemsInCart: number;
    animateType: string;
    startAnimateUp: string;
    priceRange: number;
    counter: number;
    totalAmount: number;
    payId: string;
    discountType: TypeDiscount;
    discountPercent: number;
    discountAmount: number;
}

/**
 * Basic product model as returned by productsFood (server model).
 * Add fields as your GraphQL schema evolves; keep server -> client mapping explicit.
 */
export interface ProductFood extends Product {
    pId: string
    pName: string
    stock: number
    manageStock: boolean
}

/**
 * Extra product attached to a product inside cart.
 */
export interface ExtraItem {
    exPid: string
    extraPrice: number
    quantity: number
    newExtraPrice?: number
    __typename?: string
    [key: string]: any
}

/**
 * Sub option element for optional groups
 */
export interface SubOptionalItem {
    opSubExPid: string
    name?: string
    check?: boolean
    price?: number
    __typename?: string
}

/**
 * Optional group of sub options
 */
export interface OptionalGroup {
    opExPid: string
    name?: string
    ExtProductFoodsSubOptionalAll: SubOptionalItem[]
    code?: string
    __typename?: string
}


/**
 * Item stored inside the sales reducer PRODUCT array.
 */
export interface SaleProduct {
    pId: string
    pName?: string
    // quantity currently chosen
    ProQuantity: number
    // total price for the quantity (without extras)
    ProPrice: number
    unitPrice?: number
    comment?: string
    dataExtra?: ExtraItem[]
    dataOptional?: OptionalGroup[]
    free?: boolean
    editing?: boolean
    oldQuantity?: number
    // additional UI-only helpers
    refCodePid?: string
    [key: string]: any
}

export type SalesReducerAction =
    | { type: SalesActionTypes.ADD_TO_CART; payload: ProductFood }
    | { type: SalesActionTypes.ADD_PRODUCT; payload: SaleProduct }
    | { type: SalesActionTypes.REMOVE_PRODUCT; payload: { pId: string } }
    | { type: SalesActionTypes.REMOVE_PRODUCT_TO_CART; payload: { pId: string; ProQuantity: number } }
    | { type: SalesActionTypes.ON_CHANGE; payload: { payload: { value: number; index: number; id: string } } }
    | { type: SalesActionTypes.UPDATE_SUCCESS_QUANTITY_EDITING_PRODUCT; payload: { payload: { pId: string } } }
    | { type: SalesActionTypes.CANCEL_UPDATE_QUANTITY_EDITING_PRODUCT; payload: { payload: { pId: string } } }
    | { type: SalesActionTypes.REMOVE_ALL_PRODUCTS }
    | { type: SalesActionTypes.TOGGLE_FREE_PRODUCT; payload: { pId: string } }
    | { type: SalesActionTypes.TOGGLE_EDITING_PRODUCT; payload: { payload: { pId: string } } }
    | { type: SalesActionTypes.INCREMENT; id: string }
    | { type: SalesActionTypes.PUT_COMMENT; payload: string, value: string }
    | { type: SalesActionTypes.PUT_EXTRA_PRODUCTS_AND_OPTIONAL_PRODUCT; payload: string; dataOptional?: OptionalGroup[]; dataExtra?: ExtraItem[] }
    | { type: SalesActionTypes.PRICE_RANGE; payload: number }
    | { type: SalesActionTypes.SORT; payload: string }
    | { type: SalesActionTypes.DECREMENT }
    | { type: SalesActionTypes.PAYMENT_METHOD; payload: string }
    | { type: SalesActionTypes.APPLY_DISCOUNT; payload: any }


/**
 * Values used in forms (change, client id, comments etc)
 */
export interface ValuesState {
    change: string | number
    cliId: string | null
    comment: string
    tableId: string | null
    valueDelivery: string | number
}

/**
 * Hook return shape — keep in sync with actual returned object.
 * Export a minimal public API so consumers only see typed surface.
 */
export interface UseSalesReturn {
    loading: boolean
    loadingExtraProduct: boolean
    disabledModalItems: boolean
    loadingRegisterSale: boolean
    errorSale: boolean
    openCurrentSale: boolean | null
    code: string | null
    totalProductPrice: number
    saveDataState: any
    product: { PRODUCT: { pId: string | null } }
    data: SalesState
    openCommentModal: boolean
    inputValue: string
    arrayProduct: any[]
    delivery: boolean
    valuesDates: { fromDate: string; toDate?: string }
    print: boolean
    finalFilter: any[]
    showMore: number
    search: string
    values: ValuesState
    initialStateSales: SalesState
    productsFood: ProductFood[]
    modalItem: boolean
    sumExtraProducts: number
    oneProductToComment: any
    dataProduct: Product
    dataOptional: OptionalGroup[]
    dataExtra: ExtraItem[]
    fetchMore: () => void
    pagination: any
    discount: number
    datCat: any[]
    currentPage: number
    loadingProduct: boolean
    handleChangeCheck: (caId: string) => void
    errors: Record<string, boolean>
    handleUpdateAllExtra: () => void
    handleAddAllProductsToCart: () => void
    dispatch: React.Dispatch<SalesReducerAction>
    handlePageChange: (pageNumber: number) => void
    handleComment: (product: Product) => void
    setModalItem: (v: boolean) => void
    handleChangeFilter: (value: string) => void
    handleProduct: (PRODUCT: Product) => Promise<void>
    handleChange: (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }, error: boolean) => void
    setOpenCurrentSale: (v: any) => void
    setErrors: (e: any) => void
    onChangeInput: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleAddProduct: (product: Product) => Promise<void>
    handleRemoveValue: ({ name, value, pId }: { name: string; value: any; pId: string }) => void
    setDelivery: (v: boolean) => void
    setValues: (v: ValuesState) => void
    setShowMore: (n: number) => void
    PriceRangeFunc: (products: Product[], price: number) => any[]
    handleCleanFilter: () => null
    handleSubmit: () => void
    handleChangeFilterProduct: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleDecrementExtra: ({ Adicionales }: { Adicionales: any }) => void
    setTotalProductPrice: (n: number) => void
    setInputValue: (s: string) => void
    getSortedProduct: (data: any[], sort: string) => any[]
    handleAddOptional: ({ exOptional, codeCategory }: { exOptional?: string | null; codeCategory?: string | null }) => void
    handleIncrementExtra: ({ Adicionales, index }: { Adicionales: any; index?: number }) => void
    setProduct: (p: Product) => void
    setPrint: () => void
    PRODUCT: (state: SalesState, action: SalesReducerAction) => SalesState
}