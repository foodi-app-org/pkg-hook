import type { SendNotificationFn } from 'typesdefs';

import { SalesReducerAction, ValuesState } from '../types';

import { SalesActionTypes } from './constants';


interface HandleRemoveCommentParams {
    name: string;
    pId: string,
    value: string | null;
    values: ValuesState,
    dispatch: React.Dispatch<SalesReducerAction>
    sendNotification: SendNotificationFn,
    setValues: React.Dispatch<React.SetStateAction<ValuesState>>,
}
export const handleRemoveComment = (
    {
        name,
        value,
        pId,
        setValues,
        values,
        sendNotification,
        dispatch
    }: HandleRemoveCommentParams) => {
    setValues({
        ...values,
        [name]: value ?? ''
    })
    sendNotification({
        backgroundColor: 'success',
        title: 'Comentario eliminado',
        description: 'Has eliminado el comentario!'
    })

    return dispatch({
        type: SalesActionTypes.PUT_COMMENT,
        payload: pId,
        value: ''
    })
}