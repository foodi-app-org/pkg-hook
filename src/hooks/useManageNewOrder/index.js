import { useState } from 'react'
import {
  useGetSale,
  updateExistingOrders,
  convertDateFormat,
  useOrdersFromStore
} from '../../hooks'

export const useManageNewOrder = ({
  client,
  idStore,
  setAlertBox = ({ message, duration }) => {
    return { message, duration }
  },
  playNotificationSound = () => {},
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
    fromDate: convertDateFormat({ start: true }),
    toDate: convertDateFormat({ start: false })
  })

  const [isOpenOrder, setIsOpenOrder] = useState(false)
  const { getOnePedidoStore } = useGetSale()

  const handleNewOrder = (order) => {
    const dataOrder = data[KEY_STATUS_ORDER]
    setOrders(dataOrder)
    const { pCodeRef } = order || {}
    if (pCodeRef) {
      const isCodeRefExists = orders.some(item => item.pCodeRef === pCodeRef)
      if (isCodeRefExists) {
        return
      }
      setIsOpenOrder(true)
      playNotificationSound()
      getOnePedidoStore({
        variables: {
          pCodeRef: pCodeRef ?? ''
        }
      }).then((response) => {
        console.log(response)
        const currentSale = {
          __typename: 'StorePedidos',
          pdpId: null,
          idStore: 'MjcyMDg4ODE0ODUxNTE2NDUw',
          pCodeRef,
          payMethodPState: 0,
          pPRecoger: null,
          totalProductsPrice: 36000,
          pSState: 1,
          pDatCre: '2023-05-23T18:00:36.000Z',
          channel: 1,
          locationUser: null,
          pDatMod: '2023-05-23T18:10:12.000Z',
          getAllPedidoStore: [
            {
              __typename: 'StorePedidos',
              pdpId: 'MTg3NzQxMjgyMjQ3NTQ2MzUwMDA=',
              pId: null,
              idStore: 'MjcyMDg4ODE0ODUxNTE2NDUw',
              ShoppingCard: 'Mjc0ODA5NzAzMDAwMDMxNjQwMDA=',
              pCodeRef: 'Gi8OfUk9X6',
              pPStateP: 1,
              payMethodPState: 0,
              pPRecoger: null,
              pDatCre: '2023-05-23T18:00:36.000Z',
              pDatMod: '2023-05-23T18:00:36.000Z',
              getAllShoppingCard: {
                __typename: 'ShoppingCard',
                ShoppingCard: 'Mjc0ODA5NzAzMDAwMDMxNjQwMDA=',
                comments: '',
                cantProducts: 3,
                pId: 'NDM1MzQyMTAzNzYyNDI2MzAwMA==',
                productFood: {
                  __typename: 'ProductFood',
                  pId: 'MjUwMzIxNzA5NjYzMzk1MTQwMDA=',
                  carProId: 'MTM2MDQ0NDA3NDI1NzU4MjMwMA==',
                  colorId: null,
                  idStore: 'MjcyMDg4ODE0ODUxNTE2NDUw',
                  pName: 'Hamburguesa mas papas y gaseosa',
                  ProPrice: 12000,
                  ProDescuento: '12',
                  ProDescription: '12312312312',
                  ValueDelivery: null,
                  ProImage:
                    '//front-back-server.fly.dev/static/platos/undefined',
                  ProStar: 0,
                  pState: 1,
                  pDatCre: '2023-05-19T22:42:50.000Z',
                  pDatMod: '2023-05-19T22:42:50.000Z'
                }
              }
            }
          ]
        }
        client.cache.modify({
          fields: {
            getAllOrdersFromStore (existingOrders = []) {
              try {
                const cache = updateExistingOrders(
                  existingOrders,
                  pCodeRef,
                  1,
                  currentSale
                )
                const currentOrder = cache[KEY_STATUS_ORDER]
                const isCodeRefExists = currentOrder.some(item => item.pCodeRef === pCodeRef)
                if (isCodeRefExists) {
                  return
                }
                if (currentOrder) {
                  setOrders(currentOrder)
                }
                return cache
              } catch (e) {
                return existingOrders
              }
            }
          }
        })
      })
      setAlertBox({ message: 'Nuevo pedido', duration: 100000 })
      sendNotification({
        title: 'Pedido',
        description: 'Nuevo pedido',
        backgroundColor: 'success'
      })
    }
  }

  return [orders, { handleNewOrder, isOpenOrder, setIsOpenOrder }]
}
