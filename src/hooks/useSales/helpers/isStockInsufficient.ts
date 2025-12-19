export const isStockInsufficient = (currentQuantity: number, stock: number) => {
    return currentQuantity >= stock
}