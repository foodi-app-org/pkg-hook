export const calculateTotalPrice = (shoppingCardData) => {
  if (Array.isArray(shoppingCardData) && shoppingCardData.length) {
    return shoppingCardData.reduce((accumulator, currentItem) => {
      const { productFood = {}, cantProducts } = currentItem || {}
      const { ProPrice = 0, ValueDelivery = 0 } = productFood || {}

      const pricePerProduct = ProPrice * cantProducts
      const deliveryCost = ValueDelivery || 0
      const ExtProductFoodsAll = currentItem.ExtProductFoodsAll || []

      const extraPriceSum = ExtProductFoodsAll.reduce((extraAccumulator, extraFood) => {
        if (Number.isInteger(extraFood.newExtraPrice)) {
          return extraAccumulator + extraFood.newExtraPrice
        }
        return extraAccumulator
      }, 0)

      return accumulator + pricePerProduct + deliveryCost + extraPriceSum
    }, 0)
  }
  return 0
}
