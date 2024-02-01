import { addTenMinutes } from '../../addTenMinutes'
import { statusOpenStores } from '../../statusOpenStores'

export const getStatusForStores = (stores = []) => {
  return stores.map((store) => {
    const min = addTenMinutes(store?.deliveryTimeMinutes)
    if (store?.scheduleOpenAll) {
      return {
        ...store,
        status: { message: '', open: true },
        open: 1,
        min
      }
    }
    const dataSchedules =
      (store?.getStoreSchedules?.length > 0 && store.getStoreSchedules) || []
    const status = statusOpenStores({ dataSchedules })

    return {
      ...store,
      status,
      min,
      open: status?.open ? 1 : 0
    }
  }).sort((a, b) => b.open - a.open)
}
