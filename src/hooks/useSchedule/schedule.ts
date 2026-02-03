import { useQuery, useMutation, ApolloError } from '@apollo/client'

import {
  GET_ONE_SCHEDULE_STORE,
  GET_SCHEDULE_STORE,
  CREATE_STORE_CALENDAR,
  SET_STATUS_ALL_SCHEDULE_STORE
} from './queries'
import {
  Schedule,
  GetOneScheduleResponse,
  GetSchedulesResponse,
  BasicMutationResponse,
  UseScheduleParams,
  UseSchedulesParams
} from './types'

/**
 * Get one schedule by day and store
 * @param root0
 * @param root0.day
 * @param root0.idStore
 * @returns {Array} Schedule data and query state
 */
export const useSchedule = ({
  day = null,
  idStore
}: UseScheduleParams): [
    Schedule | null | undefined,
    { loading: boolean; error?: ApolloError }
  ] => {
  const { data, loading, error } = useQuery<GetOneScheduleResponse>(
    GET_ONE_SCHEDULE_STORE,
    {
      variables: { schDay: day, idStore }
    }
  )

  return [data?.getOneStoreSchedules, { loading, error }]
}

/**
 * Set scheduleOpenAll flag for store
 *  @param scheduleOpenAll
 * @returns {Object} Mutation handler and its states
 */
export const useSetScheduleOpenAll = (): [
  (scheduleOpenAll: boolean) => void,
  { loading: boolean; error?: ApolloError }
] => {
  const [setStoreSchedule, { loading, error }] = useMutation<
    { setScheduleOpenAll: BasicMutationResponse },
    { scheduleOpenAll: boolean }
  >(SET_STATUS_ALL_SCHEDULE_STORE, {
    onError: (e) => {
      console.error(e)
    }
  })

  const handleSetStoreSchedule = (scheduleOpenAll: boolean): void => {
    setStoreSchedule({
      variables: { scheduleOpenAll },
      update: (cache, { data }) => {
        if (!data?.setScheduleOpenAll?.success) return

        cache.modify({
          fields: {
            getStore(existingStore = {}) {
              return {
                ...existingStore,
                scheduleOpenAll
              }
            }
          }
        })
      }
    })
  }

  return [handleSetStoreSchedule, { loading, error }]
}

/**
 * Get all schedules for a store
 * @param root0
 * @param root0.schDay
 * @param root0.idStore
 * @param root0.onCompleted
 *  @returns {Array} Schedules data and query state
 */
export const useSchedules = ({
  schDay = 1,
  idStore,
  onCompleted = () => { }
}: UseSchedulesParams): [
    Schedule[] | undefined,
    { loading: boolean; error?: ApolloError }
  ] => {
  const { data, loading, error } = useQuery<GetSchedulesResponse>(
    GET_SCHEDULE_STORE,
    {
      variables: { schDay, idStore },
      onCompleted
    }
  )

  return [data?.getStoreSchedules, { loading, error }]
}

/**
 * Create schedules
 * @returns {Object} Mutation handler and its states
 */
export const useCreateSchedules = (): [
  (options: { variables: { input: unknown } }) => void,
  { loading: boolean; error?: ApolloError }
] => {
  const [setStoreSchedule, { loading, error }] = useMutation<
    { setStoreSchedule: BasicMutationResponse }
  >(CREATE_STORE_CALENDAR, {
    onError: (e) => {
      console.error(e)
    }
  })

  return [setStoreSchedule, { loading, error }]
}
