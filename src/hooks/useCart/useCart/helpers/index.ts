import { filterKeyObject } from '../../../../utils'

const filters = ['__typename']

type SubItem = { check: boolean; [key: string]: any }
type DataOptionalItem = {
  ExtProductFoodsSubOptionalAll?: SubItem[]
  [key: string]: any
}

export const filterDataOptional = (dataOptional: DataOptionalItem[]): DataOptionalItem[] => {
  if (!Array.isArray(dataOptional)) {
    throw new TypeError('Input data is not an array')
  }

  try {
    const filteredDataOptional = dataOptional.map((item: DataOptionalItem) => {
      const checkedSubOptions = item?.ExtProductFoodsSubOptionalAll?.filter((subItem: SubItem) => subItem.check === true);
      const ExtProductFoodsSubOptionalAll = checkedSubOptions?.map((subItemsOptional: SubItem) => {
        return {
          ...filterKeyObject(subItemsOptional, filters, false),
          check: subItemsOptional.check
        } as SubItem
      });
      return {
        ...filterKeyObject(item, filters, false),
        ExtProductFoodsSubOptionalAll
      }
    }).filter((item) => Array.isArray(item.ExtProductFoodsSubOptionalAll) && item.ExtProductFoodsSubOptionalAll.length > 0);
    return filteredDataOptional
  } catch (error) {
    if (error instanceof Error) {
      console.error('An error occurred while filtering data:', error.message)
    } else {
      console.error('An unknown error occurred while filtering data:', error)
    }
    return []
  }
}

/**
 *
 * @param filteredDataOptional
 * @returns boolean
 */
export function validateRequirements(filteredDataOptional: DataOptionalItem[]): boolean {
  if (Array.isArray(filteredDataOptional)) {
    for (const item of filteredDataOptional) {
      if (item.required === 1) {
        const checkedSubOptions = item?.ExtProductFoodsSubOptionalAll?.filter((subItem: SubItem) => { return subItem.check === true })
        if ((checkedSubOptions?.length ?? 0) !== item.numbersOptionalOnly) {
          return true
        }
      }
    }
  }
  return false
}

type ExtraItem = { exState: number; quantity: number; [key: string]: any }

/**
 *
 * @param dataExtra
 * @returns boolean
 */
export function validateExtraProducts(dataExtra: ExtraItem[]): boolean {
  const requiredItems = dataExtra.filter((item: ExtraItem) => { return item.exState === 1 })

  if (requiredItems.length > 0) {
    const hasSelectedRequiredProduct = requiredItems.some((item: ExtraItem) => { return item.quantity > 0 })
    return hasSelectedRequiredProduct
  }

  return true
}

export const filterExtra = (dataExtra: ExtraItem[]): ExtraItem[] => {
  if (!Array.isArray(dataExtra)) {
    throw new TypeError('Input data is not an array')
  }
  const dataExtraFiltered = dataExtra.filter((extra: ExtraItem) => extra.quantity !== 0)
    .map((extra: ExtraItem) => {
      return {
        ...filterKeyObject(extra, filters, false),
        exState: extra.exState,
        quantity: extra.quantity
      } as ExtraItem
    });
  return dataExtraFiltered
}
