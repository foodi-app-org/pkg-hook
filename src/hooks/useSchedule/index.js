import { useQuery, useMutation } from '@apollo/client'
import {
  GET_ONE_SCHEDULE_STORE,
  GET_SCHEDULE_STORE,
  CREATE_STORE_CALENDAR,
  SET_STATUS_ALL_SCHEDULE_STORE
} from './queries'

export const useSchedule = ({ day = null, idStore = '' }) => {
  const {
    data,
    loading,
    error
  } = useQuery(GET_ONE_SCHEDULE_STORE, { variables: { schDay: day, idStore } })

  return [data?.getOneStoreSchedules, { loading, error }]
}

export const useSetScheduleOpenAll = () => {
  const [setStoreSchedule, { loading, error }] = useMutation(SET_STATUS_ALL_SCHEDULE_STORE, {
    onError: (e) => {
      console.error(e);
    }
  });

  const handleSetStoreSchedule = (scheduleOpenAll) => {
    setStoreSchedule({
      variables: {
        scheduleOpenAll: scheduleOpenAll
      }, update: (cache, { data }) => {
        const success = data?.setScheduleOpenAll?.success
        if (success) {
          cache.modify({
            fields: {
              getStore (_, { readField }) {
                const store = readField('getStore')
                const updatedCart = {
                  ...store,
                  scheduleOpenAll: scheduleOpenAll
                  }
                  return updatedCart
              }
            }
          })
        }
      }
    });
  };

  return [handleSetStoreSchedule, { loading, error }];
};


export const useSchedules = ({ schDay = 1, idStore = '' }) => {
  const {
    data,
    loading,
    error
  } = useQuery(GET_SCHEDULE_STORE, { variables: { schDay, idStore } })

  return [data?.getStoreSchedules, { loading, error }]
}

export const useCreateSchedules = () => {
  const [setStoreSchedule, { loading, error }] = useMutation(CREATE_STORE_CALENDAR, {
    onError: (e) => {
      console.error(e)
    }
  })

  return [setStoreSchedule, { loading, error }]
}
