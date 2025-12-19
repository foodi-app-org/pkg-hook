/**
 * resolveProduct - resolve product from local memory or fetch from API
 * @param {{ pId: string, productsFood?: any[], fetchProduct: (params:{pId:string}) => Promise<any> }} args
 * @returns {Promise<any|null>} resolved product or null if not found
 */
export const resolveProduct = async ({
  pId,
  productsFood = [],
  fetchProduct
}: {
  pId: string
  productsFood?: any[]
  fetchProduct: (params: { pId: string }) => Promise<any>
}): Promise<any | null> => {
  if (!pId) return null

  // fast memory lookup
  const mem = productsFood.find((it: any) => it?.pId === pId)
  if (mem) return mem

  // fetch from API and normalize
  try {
    const res = await fetchProduct({ pId })
    return res?.data?.productFoodsOne ?? null
  } catch (err) {
    // bubble up null — caller will notify
    return null
  }
}
