import type { Product, SendNotificationFn } from 'typesdefs';

import { SalesState } from '../types'

// You may need to import or define sendNotification, setOpenCommentModal, and openCommentModal
// For now, we'll define them as placeholders to avoid errors

interface ICommentProductProps {
    state: SalesState;
    action: {
        payload: string | number;
    };
    deleteValue?: boolean;
    value?: string;
    openCommentModal?: boolean;
    setOpenCommentModal?: (open: boolean) => void;
    sendNotification?: SendNotificationFn
}

/**
 *
 * @param state
 * @param state.state
 * @param action
 * @param action.payload
 * @param state.action
 * @param deleteValue
 * @param comment
 * @param state.deleteValue
 * @param state.value
 * @param state.setOpenCommentModal
 * @returns {any}  Updated state.
 */
export const handleCommentProduct = ({
    state,
    action,
    deleteValue = false,
    value = '',
    openCommentModal = false,
    setOpenCommentModal = () => { },
    sendNotification = () => { },
}: ICommentProductProps) => {
    if (value) {
        sendNotification({
            backgroundColor: 'success',
            title: deleteValue ? 'Comentario eliminado' : 'Producto comentado',
            description: deleteValue ? 'Has eliminado el comentario!' : 'Has comentado!'
        });
    }
    setOpenCommentModal(!openCommentModal);
    return {
        ...state,
        PRODUCT: state?.PRODUCT?.map((items: Product) => {
            return items.pId === action.payload
                ? {
                    ...items,
                    comment: deleteValue ? '' : value
                }
                : items;
        })
    };
};