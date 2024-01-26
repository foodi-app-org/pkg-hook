import { statusOpenStores } from '../../statusOpenStores'

export const getStatusForStores = (stores = []) => {
  return stores.map((store) => {
    if (store?.scheduleOpenAll) {
      return {
        ...store,
        status: { message: '', open: true },
        open: 1
      }
    }
    const dataSchedules =
      (store?.getStoreSchedules?.length > 0 && store.getStoreSchedules) || []
    const status = statusOpenStores({ dataSchedules })
    return {
      ...store,
      status,
      open: status?.open ? 1 : 0
    }
  }).sort((a, b) => b.open - a.open)
}
