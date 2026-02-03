import { useMutation } from '@apollo/client'

import { CREATE_PROVIDERS } from '../queries'

import type { AlertBoxType, SetAlertBoxFn } from 'typesdefs'

interface UseProvidersCreateStoreOptions {
  setAlertBox?: SetAlertBoxFn
}
export const useProvidersCreateStore = ({ setAlertBox = () => { } }: UseProvidersCreateStoreOptions = {}) => {
  const [registerProviders, { loading, error }] = useMutation(CREATE_PROVIDERS, {
    onCompleted: (data) => {
      setAlertBox({
        type: AlertBoxType.SUCCESS,
        message: `${data.registerProviders.message}`
      })
    }
  })

  return [registerProviders, { loading, error }]
}
