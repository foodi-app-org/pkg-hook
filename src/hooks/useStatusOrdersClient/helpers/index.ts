type Order = {
  pSState: number;
  pDatMod: string | Date;
  [key: string]: any;
};

export const filterOrders = (orders: Order[] = []) => {
  const filteredOrders = orders?.filter((order) => {
    if (order.pSState === 5) {
      const tenMinutesAgo = new Date();
      tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
      const pDatMod = new Date(order.pDatMod);

      return pDatMod > tenMinutesAgo;
    }
    return true
  });

  return filteredOrders;
}
