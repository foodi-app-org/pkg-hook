import type { SendNotificationFn } from 'typesdefs'

/**
 *
 * @param stock
 * @param sendNotification
 * @returns alert stock
 */
export const sendAlertStock = (stock: number, sendNotification: SendNotificationFn) => {
    return sendNotification({
        title: 'Stock insuficiente',
        backgroundColor: 'warning',
        description: `Solo hay ${stock} unidades disponibles en el inventario`
    })
}