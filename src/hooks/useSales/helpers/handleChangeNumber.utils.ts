import { SalesReducerAction, SalesState } from '../types'

import type {
    Product,
    SendNotificationFn
} from 'typesdefs'

interface QuantityChangeEvent {
    value?: string | number | null
    index?: number
    id?: string | number
}

interface ParsedDecimal {
    integer: bigint
    scale: number
}

/**
 * Parses a decimal value without using floating-point arithmetic.
 *
 * Supports:
 * 10
 * 10.25
 * 0.1
 * 1e-2
 * "10.25"
 */
function parseDecimal(
    value: string | number
): ParsedDecimal | null {
    const normalized = String(value)
        .trim()
        .replace(',', '.')

    if (!normalized) {
        return null
    }

    const match = normalized.match(
        /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d+))?$/i
    )

    if (!match) {
        return null
    }

    const [
        ,
        sign,
        integerPart = '',
        decimalPart = '',
        leadingDecimalPart = '',
        exponentPart = '0'
    ] = match

    const exponent = Number(exponentPart)

    if (!Number.isFinite(exponent)) {
        return null
    }

    const fractionalDigits =
        decimalPart || leadingDecimalPart

    let digits = `${integerPart}${fractionalDigits}`

    let scale =
        fractionalDigits.length - exponent

    if (scale < 0) {
        digits += '0'.repeat(Math.abs(scale))
        scale = 0
    }

    digits = digits.replace(/^0+(?=\d)/, '')

    if (!digits) {
        digits = '0'
    }

    let integer: bigint

    try {
        integer = BigInt(
            `${sign === '-' ? '-' : ''}${digits}`
        )
    } catch {
        return null
    }

    return {
        integer,
        scale
    }
}

/**
 * Converts money into minor monetary units using HALF_UP rounding.
 *
 * Example:
 * 10.25 -> 1025
 * 10.1  -> 1010
 * 1287.4399999999991 -> 128744
 */
export function moneyToMinorUnits(
    value: string | number
): bigint | null {
    const parsed = parseDecimal(value)

    if (!parsed) {
        return null
    }

    const MONEY_SCALE = 2

    if (parsed.scale <= MONEY_SCALE) {
        const multiplier =
            10n ** BigInt(
                MONEY_SCALE - parsed.scale
            )

        return parsed.integer * multiplier
    }

    const divisor =
        10n ** BigInt(
            parsed.scale - MONEY_SCALE
        )

    let units =
        parsed.integer / divisor

    const remainder =
        parsed.integer % divisor

    const absoluteRemainder =
        remainder < 0n
            ? -remainder
            : remainder

    if (
        absoluteRemainder * 2n >= divisor
    ) {
        units +=
            parsed.integer >= 0n
                ? 1n
                : -1n
    }

    return units
}

/**
 * Converts minor units back to the monetary Number representation used
 * by the existing Product type.
 *
 * The returned Number is suitable for UI/state values with 2 decimals.
 */
export function minorUnitsToMoney(
    value: bigint
): number {
    return Number(value) / 100
}

/**
 * Rounds a monetary value to 2 decimals using HALF_UP rounding.
 */
export function roundMoney(
    value: string | number
): number {
    const minorUnits = moneyToMinorUnits(value)

    if (minorUnits === null) {
        return 0
    }

    return minorUnitsToMoney(minorUnits)
}

/**
 * Adds two monetary values without floating-point accumulation.
 */
export function addMoney(
    first: string | number,
    second: string | number
): number {
    const firstUnits =
        moneyToMinorUnits(first)

    const secondUnits =
        moneyToMinorUnits(second)

    if (
        firstUnits === null ||
        secondUnits === null
    ) {
        return 0
    }

    return minorUnitsToMoney(
        firstUnits + secondUnits
    )
}

/**
 * Sums multiple monetary values using integer minor units.
 */
export function sumMoney(
    values: Array<string | number | null | undefined>
): number {
    const totalUnits = values.reduce(
        (total, value) => {
            if (
                value === null ||
                value === undefined
            ) {
                return total
            }

            const units =
                moneyToMinorUnits(value)

            if (units === null) {
                return total
            }

            return total + units
        },
        0n
    )

    return minorUnitsToMoney(totalUnits)
}

/**
 * Multiplies unit price by quantity using exact decimal arithmetic
 * and rounds the monetary result to 2 decimals.
 *
 * Examples:
 *
 * 10.25 × 3 = 30.75
 * 10.10 × 3 = 30.30
 * 0.10 × 3 = 0.30
 * 1287.4399999999991 × 1 = 1287.44
 */
export function multiplyMoney(
    unitPrice: string | number,
    quantity: string | number
): number {
    const price =
        parseDecimal(unitPrice)

    const qty =
        parseDecimal(quantity)

    if (!price || !qty) {
        return 0
    }

    const multiplied =
        price.integer * qty.integer

    const scale =
        price.scale + qty.scale

    const MONEY_SCALE = 2

    if (scale <= MONEY_SCALE) {
        const multiplier =
            10n ** BigInt(
                MONEY_SCALE - scale
            )

        return minorUnitsToMoney(
            multiplied * multiplier
        )
    }

    const divisor =
        10n ** BigInt(
            scale - MONEY_SCALE
        )

    let units =
        multiplied / divisor

    const remainder =
        multiplied % divisor

    const absoluteRemainder =
        remainder < 0n
            ? -remainder
            : remainder

    if (
        absoluteRemainder * 2n >= divisor
    ) {
        units +=
            multiplied >= 0n
                ? 1n
                : -1n
    }

    return minorUnitsToMoney(units)
}

/**
 * Extracts the quantity-change payload safely from the reducer action.
 */
function getEventFromAction(
    action: SalesReducerAction
): QuantityChangeEvent {
    if (
        !action ||
        typeof action !== 'object'
    ) {
        return {}
    }

    if (
        !('payload' in action) ||
        !action.payload
    ) {
        return {}
    }

    if (
        typeof action.payload !== 'object' ||
        Array.isArray(action.payload)
    ) {
        return {}
    }

    return action.payload as QuantityChangeEvent
}

/**
 * Normalizes product IDs.
 */
export function normalizeProductId(
    id: string | number | null | undefined
): string {
    if (
        id === null ||
        id === undefined
    ) {
        return ''
    }

    return String(id).trim()
}

/**
 * Finds a product exclusively by pId.
 *
 * Never relies on the visual/rendered array index.
 */
export function findProductById(
    products: Product[],
    id: string | number
): Product | undefined {
    const normalizedId =
        normalizeProductId(id)

    if (!normalizedId) {
        return undefined
    }

    return products.find(
        (item: Product) =>
            normalizeProductId(item?.pId) ===
            normalizedId
    )
}

/**
 * Parses a quantity.
 *
 * An empty input returns null instead of zero.
 * This prevents an input temporarily cleared by the user from
 * automatically deleting the product.
 */
function parseQuantity(
    value: string | number | null | undefined
): number | null {
    if (
        value === null ||
        value === undefined
    ) {
        return null
    }

    if (
        typeof value === 'string' &&
        value.trim() === ''
    ) {
        return null
    }

    const quantity = Number(value)

    if (!Number.isFinite(quantity)) {
        return null
    }

    if (quantity < 0) {
        return 0
    }

    return quantity
}

function notifyNoStock(
    sendNotification: SendNotificationFn
): void {
    sendNotification({
        title: 'Sin stock',
        backgroundColor: 'warning',
        description: 'Producto sin stock disponible'
    })
}

function notifyProductRemoved(
    sendNotification: SendNotificationFn,
    productName: string
): void {
    sendNotification({
        title: 'Producto eliminado',
        backgroundColor: 'info',
        description: `Has eliminado ${productName} del carrito.`
    })
}

function notifyStockExceeded(
    sendNotification: SendNotificationFn,
    productName: string,
    stock: number
): void {
    sendNotification({
        title: 'Stock insuficiente',
        backgroundColor: 'warning',
        description:
            `No puedes agregar más unidades de ${productName}. ` +
            `Stock disponible: ${stock}`
    })
}

/**
 * Updates ONLY the product identified by pId.
 */
function updateProductQuantity(
    products: Product[],
    productId: string | number,
    finalQuantity: number,
    unitPrice: number
): Product[] {
    const normalizedId =
        normalizeProductId(productId)

    const lineTotal =
        multiplyMoney(
            unitPrice,
            finalQuantity
        )

    return products.map(
        (item: Product) => {
            if (
                normalizeProductId(item?.pId) !==
                normalizedId
            ) {
                return item
            }

            return {
                ...item,
                ProQuantity: finalQuantity,
                ProPrice: lineTotal
            }
        }
    )
}

function shouldReturnEarly(
    event: QuantityChangeEvent,
    state: SalesState,
    productsFood: Product[]
): boolean {
    const normalizedId =
        normalizeProductId(event.id)

    if (!normalizedId) {
        return true
    }

    if (
        !state ||
        typeof state !== 'object'
    ) {
        return true
    }

    if (!Array.isArray(state.PRODUCT)) {
        return true
    }

    if (!Array.isArray(productsFood)) {
        return true
    }

    const productExist =
        findProductById(
            productsFood,
            normalizedId
        )

    const oneProduct =
        findProductById(
            state.PRODUCT,
            normalizedId
        )

    return !productExist || !oneProduct
}

function handleNoStock(
    productExist: Product,
    sendNotification: SendNotificationFn,
    state: SalesState
): SalesState | null {
    if (!productExist.manageStock) {
        return null
    }

    const stock =
        Number(productExist.stock)

    if (
        !Number.isFinite(stock) ||
        stock <= 0
    ) {
        notifyNoStock(sendNotification)
        return state
    }

    return null
}

function handleRemoveProduct({
    value,
    sendNotification,
    oneProduct,
    state,
    id
}: {
    value: number
    sendNotification: SendNotificationFn
    oneProduct: Product
    state: SalesState
    id: string | number
}): SalesState | null {
    if (
        !Number.isFinite(value) ||
        value > 0
    ) {
        return null
    }

    notifyProductRemoved(
        sendNotification,
        oneProduct.pName ?? 'producto'
    )

    const currentQuantity =
        Number(oneProduct.ProQuantity)

    const safeCurrentQuantity =
        Number.isFinite(currentQuantity) &&
        currentQuantity > 0
            ? currentQuantity
            : 0

    const normalizedId =
        normalizeProductId(id)

    return {
        ...state,
        PRODUCT: state.PRODUCT.filter(
            (item: Product) =>
                normalizeProductId(item.pId) !==
                normalizedId
        ),
        counter: Math.max(
            0,
            (Number(state.counter) || 0) -
            safeCurrentQuantity
        )
    }
}

function getFinalQuantity(
    productExist: Product,
    value: number
): number {
    if (!Number.isFinite(value)) {
        return 0
    }

    const safeValue =
        Math.max(0, value)

    if (!productExist.manageStock) {
        return safeValue
    }

    const stock =
        Number(productExist.stock)

    if (
        !Number.isFinite(stock) ||
        stock <= 0
    ) {
        return 0
    }

    return Math.min(
        safeValue,
        stock
    )
}

function handleStockExceeded(
    requestedQuantity: number,
    productExist: Product,
    sendNotification: SendNotificationFn,
    oneProduct: Product
): void {
    if (!productExist.manageStock) {
        return
    }

    const stock =
        Number(productExist.stock)

    if (
        Number.isFinite(stock) &&
        requestedQuantity > stock
    ) {
        notifyStockExceeded(
            sendNotification,
            oneProduct.pName ?? 'producto',
            stock
        )
    }
}

/**
 * Handles quantity changes for products in the cart.
 *
 * IMPORTANT:
 * Product identity is ALWAYS determined by pId.
 * The incoming index is intentionally ignored.
 *
 * This prevents updates from going to another product when several
 * products are simultaneously being edited, sorted, filtered,
 * virtualized or reordered.
 */
export const handleChangeNumber = (
    state: SalesState,
    action: SalesReducerAction,
    productsFood: Product[] = [],
    sendNotification: SendNotificationFn
): SalesState => {
    const event =
        getEventFromAction(action)

    const {
        value,
        id
    } = event

    if (
        !sendNotification ||
        typeof sendNotification !== 'function'
    ) {
        return state
    }

    if (
        shouldReturnEarly(
            event,
            state,
            productsFood
        )
    ) {
        return state
    }

    const normalizedId =
        normalizeProductId(id)

    const productExist =
        findProductById(
            productsFood,
            normalizedId
        )

    const oneProduct =
        findProductById(
            state.PRODUCT,
            normalizedId
        )

    if (
        !productExist ||
        !oneProduct
    ) {
        return state
    }

    const parsedQuantity =
        parseQuantity(value)

    /**
     * Empty input is handled by the input component itself.
     *
     * We intentionally do not treat "" as 0 here.
     */
    if (parsedQuantity === null) {
        return state
    }

    /**
     * A quantity <= 0 explicitly removes the product.
     * This happens BEFORE stock validation so a product can still
     * be removed even if its current stock is zero.
     */
    const removeProductResult =
        handleRemoveProduct({
            value: parsedQuantity,
            sendNotification,
            oneProduct,
            state,
            id: normalizedId
        })

    if (removeProductResult) {
        return removeProductResult
    }

    /**
     * In the catalog, ProPrice is assumed to be the UNIT selling price.
     *
     * The resulting cart item ProPrice is the LINE TOTAL.
     */
    const unitPrice =
        Number(productExist.ProPrice)

    if (
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
    ) {
        return state
    }

    /**
     * Stock validation only applies to positive quantities.
     */
    const noStockResult =
        handleNoStock(
            productExist,
            sendNotification,
            state
        )

    if (noStockResult) {
        return noStockResult
    }

    const finalQuantity =
        getFinalQuantity(
            productExist,
            parsedQuantity
        )

    handleStockExceeded(
        parsedQuantity,
        productExist,
        sendNotification,
        oneProduct
    )

    const currentQuantity =
        Number(oneProduct.ProQuantity)

    const safeCurrentQuantity =
        Number.isFinite(currentQuantity) &&
        currentQuantity >= 0
            ? currentQuantity
            : 0

    /**
     * Counter must reflect the DELTA in quantity.
     *
     * Example:
     * 2 -> 5 = +3
     * 5 -> 2 = -3
     * 5 -> 5 =  0
     */
    const quantityDelta =
        finalQuantity -
        safeCurrentQuantity

    /**
     * No change means no new state object.
     */
    if (quantityDelta === 0) {
        return state
    }

    const updatedProducts =
        updateProductQuantity(
            state.PRODUCT,
            normalizedId,
            finalQuantity,
            unitPrice
        )

    const currentCounter =
        Number(state.counter) || 0

    const nextCounter =
        Math.max(
            0,
            currentCounter + quantityDelta
        )

    return {
        ...state,
        PRODUCT: updatedProducts,
        counter: nextCounter
    }
}