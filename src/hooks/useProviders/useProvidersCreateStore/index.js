import { useMutation } from "@apollo/client"
import { CREATE_PROVIDERS } from "../queries"

export const useProvidersCreateStore = ({ setAlertBox = () => { return } } = {}) => {

      const [registerProviders, { loading, error }] = useMutation(CREATE_PROVIDERS, {
    onCompleted: (data) => {
      setAlertBox({ message: `${data.registerProviders.message}` })
    }
  })

    return [registerProviders, { loading, error }]
}