import { useEffect, useState } from 'react'
import {
  useGetSale,
  updateExistingOrders,
  convertDateFormat,
  useOrdersFromStore
} from '../../hooks'
import { findOrderByCodeRef, isDateInRange } from './helpers'

export const useManageNewOrder = ({
  client,
  idStore,
  setAlertBox = ({ message, duration }) => {
    return { message, duration }
  },
  playNotificationSound = () => {},
  setIsOpenOrder = (boolean) => { return boolean },
  setCountOrders = (number) => { return number },
  sendNotification = ({ title, description, backgroundColor }) => {
    return {
      title,
      description,
      backgroundColor
    }
  }
}) => {
  const KEY_STATUS_ORDER = 'ACEPTA'
  const [orders, setOrders] = useState([])

  const [data] = useOrdersFromStore({
    idStore,
    search: '',
    fromDate: convertDateFormat({ start: true }),
    toDate: convertDateFormat({ start: false })
  })

  useEffect(() => {
    if (data) {
      const dataOrder = data[KEY_STATUS_ORDER]
      if (Array.isArray(dataOrder) && dataOrder) {
        const filteredOrders = dataOrder.filter(order =>
          isDateInRange(order?.pDatCre) && order?.pSState === 1
        ) ?? []
        setOrders(filteredOrders)
        setCountOrders(filteredOrders.length)
      }
    }
  }, [data])

  const { getOneSalesStore } = useGetSale()

  const handleNewOrder = (order) => {
    const dataOrder = data[KEY_STATUS_ORDER]
    setOrders(dataOrder)
    const { pCodeRef } = order || {}
    if (pCodeRef) {
      const isCodeRefExists = findOrderByCodeRef(data, pCodeRef)
      if (isCodeRefExists) {
        return
      }
      setIsOpenOrder(true)
      getOneSalesStore({
        variables: {
          pCodeRef: pCodeRef ?? ''
        }
      }).then((response) => {
        console.log(response)
        // const currentSale = response?.data?.getOneSalesStore || {}
        client.cache.modify({
          fields: {
            // getAllOrdersFromStore (existingOrders = []) {
            //   try {
            //     const cache = updateExistingOrders(
            //       existingOrders,
            //       pCodeRef,
            //       1,
            //       currentSale
            //     )
            //     const currentOrder = cache[KEY_STATUS_ORDER]
            //     const filteredOrders = currentOrder.filter(order =>
            //       isDateInRange(order.pDatCre)
            //     )
            //     setOrders(filteredOrders)
            //     playNotificationSound()
            //     return cache
            //   } catch (e) {
            //     return existingOrders
            //   }
            // }
          }
        })
      })
      sendNotification({
        title: 'Pedido',
        description: 'Nuevo pedido',
        backgroundColor: 'success'
      })
    }
  }

  return [orders, { handleNewOrder }]
}
