import { SalesState } from '../types'

import type {
    Product,
    SendNotificationFn
} from 'typesdefs'

interface ICommentProductProps {
    state: SalesState
    pId: string | number
    deleteValue?: boolean
    value?: string
    openCommentModal?: boolean
    setOpenCommentModal?: (open: boolean) => void
    sendNotification?: SendNotificationFn
}

export const handleCommentProduct = ({
    state,
    pId,
    deleteValue = false,
    value = '',
    openCommentModal = false,
    setOpenCommentModal = () => {},
    sendNotification = () => {}
}: ICommentProductProps): SalesState => {
    if (!state || typeof state !== 'object') {
        return state
    }

    if (!Array.isArray(state.PRODUCT)) {
        return state
    }

    if (
        pId === null ||
        pId === undefined ||
        pId === '' ||
        (typeof pId !== 'string' && typeof pId !== 'number')
    ) {
        return state
    }

    const normalizedPId = String(pId).trim()

    if (!normalizedPId) {
        return state
    }

    const productIndex = state.PRODUCT.findIndex(
        (item: Product) =>
            item?.pId !== null &&
            item?.pId !== undefined &&
            String(item.pId).trim() === normalizedPId
    )

    if (productIndex === -1) {
        return state
    }

    const currentProduct = state.PRODUCT[productIndex]

    if (!currentProduct) {
        return state
    }

    const normalizedValue = typeof value === 'string'
        ? value.trim()
        : ''

    const currentComment = typeof currentProduct.comment === 'string'
        ? currentProduct.comment.trim()
        : ''

    // Un valor vacío significa que el comentario se está eliminando.
    const shouldDeleteComment =
        deleteValue || normalizedValue.length === 0

    const nextComment = shouldDeleteComment
        ? ''
        : normalizedValue

    // Evita actualizar el estado si realmente no hubo ningún cambio.
    if (currentComment === nextComment) {
        if (typeof setOpenCommentModal === 'function') {
            setOpenCommentModal(!openCommentModal)
        }

        return state
    }

    const updatedProduct: Product = {
        ...currentProduct,
        comment: nextComment
    }

    const PRODUCT = [...state.PRODUCT]

    PRODUCT[productIndex] = updatedProduct

    // ---------------------------------------------------------
    // Notifications
    // ---------------------------------------------------------

    if (typeof sendNotification === 'function') {
        if (shouldDeleteComment) {
            sendNotification({
                backgroundColor: 'success',
                title: 'Comentario eliminado',
                description: 'El comentario del producto ha sido eliminado correctamente.'
            })
        } else if (currentComment) {
            sendNotification({
                backgroundColor: 'success',
                title: 'Comentario actualizado',
                description: 'El comentario del producto ha sido actualizado correctamente.'
            })
        } else {
            sendNotification({
                backgroundColor: 'success',
                title: 'Producto comentado',
                description: 'El comentario ha sido agregado correctamente.'
            })
        }
    }

    // ---------------------------------------------------------
    // Close modal
    // ---------------------------------------------------------

    if (typeof setOpenCommentModal === 'function') {
        setOpenCommentModal(!openCommentModal)
    }

    return {
        ...state,
        PRODUCT
    }
}