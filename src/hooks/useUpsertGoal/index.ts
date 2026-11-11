
import { gql, useMutation } from '@apollo/client'

import type { SendNotificationFn } from 'typesdefs'

type UpsertGoalInput = {
    idStore: string
    dailyGoal: number
}

type UpsertGoalData = {
    success: boolean
    message: string
    data: {
        idStore: string
        dailyGoal: number
    } | null
}

type UseUpsertGoalOptions = {
    sendNotification?: SendNotificationFn
}

/**
 * GraphQL mutation to upsert the store daily goal.
 */
const UPSERT_GOAL = gql`
    mutation UpsertGoal($input: CreateGoalInput!) {
        upsertGoal(input: $input) {
            success
            message
            data {
                idStore
                dailyGoal
            }
        }
    }
`

export const useUpsertGoal = ({
    sendNotification = () => {}
}: UseUpsertGoalOptions = {}) => {

    const [upsertGoalMutation, { data, loading }] = useMutation<
        { upsertGoal: UpsertGoalData },
        { input: UpsertGoalInput }
    >(UPSERT_GOAL, {
        onCompleted({ upsertGoal }) {
            sendNotification({
                title: upsertGoal?.success ? 'Éxito' : 'Error',
                description:
                    upsertGoal?.message || 'No se pudo actualizar la meta del día',
                backgroundColor: upsertGoal?.success ? 'success' : 'warning'
            })
        },

        update(cache, { data: mutationData }) {
            const result = mutationData?.upsertGoal

            if (!result?.success || !result.data) return

            const { idStore, dailyGoal } = result.data

            /**
             * Obtiene las entidades normalizadas almacenadas en Apollo.
             */
            const normalizedCache = cache.extract()

            /**
             * Busca el Store correspondiente utilizando idStore.
             *
             * Apollo normalmente identifica esta entidad mediante:
             * Store:<id>
             *
             * Por eso no utilizamos idStore directamente como cache ID.
             */
            const storeCacheIds = Object.entries(normalizedCache)
                .filter(([, value]) => {
                    if (!value || typeof value !== 'object') {
                        return false
                    }

                    const store = value as Record<string, unknown>

                    return (
                        store.__typename === 'Store' &&
                        store.idStore === idStore
                    )
                })
                .map(([cacheId]) => cacheId)

            /**
             * Actualiza dailyGoal directamente en la entidad Store.
             *
             * Tanto GET_ONE_STORE como GET_ONE_STORE_BY_ID
             * reflejarán el cambio si comparten la misma entidad normalizada.
             */
            storeCacheIds.forEach((cacheId) => {
                cache.modify({
                    id: cacheId,
                    fields: {
                        dailyGoal() {
                            return dailyGoal
                        }
                    }
                })
            })
        }
    })

    const upsertGoal = (input: UpsertGoalInput) => {
        upsertGoalMutation({
            variables: { input }
        })
    }

    return [
        upsertGoal,
        {
            data: data?.upsertGoal,
            loading
        }
    ] as [
        (input: UpsertGoalInput) => void,
        {
            data: UpsertGoalData | undefined
            loading: boolean
        }
    ]
}
