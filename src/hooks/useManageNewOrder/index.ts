import { useEffect, useState } from 'react'

import {
  useGetSale,
  // updateExistingOrders,
  useOrdersFromStore
} from '..'

import { findOrderByCodeRef, isDateInRange } from './helpers'

import type { SendNotificationFn } from 'typesdefs'

type UseManageNewOrderProps = {
  client: any
  idStore?: string
  setIsOpenOrder?: (value: boolean) => void
  setCountOrders?: (value: number) => void
  sendNotification?: SendNotificationFn
}

export const useManageNewOrder = ({
  client,
  idStore,
  setIsOpenOrder,
  setCountOrders,
  sendNotification
}: UseManageNewOrderProps) => {
  // eslint-disable-next-line
  console.log('🚀 ~ useManageNewOrder ~ idStore:', idStore)
  const KEY_STATUS_ORDER = 'ACEPTA'
  const [orders, setOrders] = useState<any[]>([])

  const [data] = useOrdersFromStore({
    callback: (data: any) => {
      return data?.getAllOrderStoreFinal
    }
  })

  useEffect(() => {
    if (data && typeof data === 'object' && KEY_STATUS_ORDER in data) {
      const dataOrder = (data as Record<string, any[]>)[KEY_STATUS_ORDER]
      if (Array.isArray(dataOrder) && dataOrder) {
        const filteredOrders = dataOrder.filter((order: any) =>
          isDateInRange(order?.pDatCre) && order?.pSState === 1
        ) ?? []
        setOrders(filteredOrders)
        setCountOrders?.(filteredOrders.length)
      }
    }
  }, [data])

  const { getOneSalesStore } = useGetSale()

  const handleNewOrder = (order: any) => {
    if (data && typeof data === 'object' && KEY_STATUS_ORDER in data) {
      const dataOrder = (data as Record<string, any[]>)[KEY_STATUS_ORDER]
      setOrders(dataOrder)
      const { pCodeRef } = order || {}
      if (pCodeRef) {
        const isCodeRefExists = findOrderByCodeRef(data as Record<string, { [key: string]: any; pCodeRef: string; }[]>, pCodeRef)
        if (isCodeRefExists) {
          return
        }
        setIsOpenOrder?.(true)
        getOneSalesStore({
          variables: {
            pCodeRef: pCodeRef ?? ''
          }
        }).then((response: any) => {
          console.error(response)
          client.cache.modify({
            fields: {
            }
          })
        })
        sendNotification?.({
          title: 'Pedido',
          description: 'Nuevo pedido',
          backgroundColor: 'success'
        })
      }
    }
  }

  return [orders, { handleNewOrder }]
}
