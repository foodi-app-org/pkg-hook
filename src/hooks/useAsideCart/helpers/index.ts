interface ExtraFood {
  newExtraPrice: number;
  [key: string]: any;
}

interface ProductFood {
  ProPrice?: number;
  ValueDelivery?: number;
  [key: string]: any;
}

interface ShoppingCartItem {
  productFood?: ProductFood;
  cantProducts: number;
  ExtProductFoodsAll?: ExtraFood[];
  [key: string]: any;
}

export const calculateTotalPrice = (shoppingCardData: ShoppingCartItem[]): number => {
  if (Array.isArray(shoppingCardData) && shoppingCardData.length) {
    return shoppingCardData.reduce((accumulator: number, currentItem: ShoppingCartItem) => {
      const { productFood = {}, cantProducts } = currentItem || {};
      const { ProPrice = 0, ValueDelivery = 0 } = productFood || {};

      const pricePerProduct = ProPrice * cantProducts;
      const deliveryCost = ValueDelivery || 0;
      const ExtProductFoodsAll = currentItem.ExtProductFoodsAll || [];

      const extraPriceSum = ExtProductFoodsAll.reduce(
        (extraAccumulator: number, extraFood: ExtraFood) => {
          if (Number.isInteger(extraFood.newExtraPrice)) {
            return extraAccumulator + extraFood.newExtraPrice;
          }
          return extraAccumulator;
        },
        0
      );

      return accumulator + pricePerProduct + deliveryCost + extraPriceSum;
    }, 0);
  }
  return 0;
}
