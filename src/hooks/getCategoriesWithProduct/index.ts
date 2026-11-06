/**
 * Normalizes text for a predictable, case- and accent-insensitive search.
 * @param value
 */
const normalizeSearchText = (value: unknown): string => {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}

/**
 * Minimal shape required by the local product search.
 */
type SearchableProduct = {
  pName?: unknown
}

type SearchableCategory<TProduct extends SearchableProduct = SearchableProduct> = {
  productFoodsAll?: TProduct[] | null
}

/**
 * Filters categories, preserving each category with only the products whose
 * names contain the search term. Empty searches return the original array.
 *
 * The optional third argument is kept for backwards compatibility with older
 * consumers that passed the former Jaccard similarity threshold.
 * @param data
 * @param productName
 * @param _similarityThreshold
 */
export const getCategoriesWithProduct = <
  TCategory extends SearchableCategory
>(
  data: TCategory[] = [],
  productName = '',
  _similarityThreshold?: number
): TCategory[] => {
  if (!Array.isArray(data)) return []

  const normalizedSearch = normalizeSearchText(productName)

  if (!normalizedSearch) return data

  return data.reduce<TCategory[]>((result, category) => {
    const products = Array.isArray(category?.productFoodsAll)
      ? category.productFoodsAll
      : []

    const matchingProducts = products.filter((product) => {
      const normalizedProductName = normalizeSearchText(product?.pName)
      return normalizedProductName.includes(normalizedSearch)
    })

    if (matchingProducts.length > 0) {
      result.push({
        ...category,
        productFoodsAll: matchingProducts
      } as TCategory)
    }

    return result
  }, [])
}

