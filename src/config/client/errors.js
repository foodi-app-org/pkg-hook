import { onError } from '@apollo/client/link/error'

export const errorHandler = (error) => {
  let logout = null
  if (error) {
    error.errors?.length && error.errors.forEach(err => {
      const { code, message: { message } } = err.extensions
      if (code === 'UNAUTHENTICATED' || code === 'FORBIDDEN') {
        logout = true
        return {
          status: 'FORBIDDEN',
          message
        }
      }
    })
  }
  return logout
}

export const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)graphQLErrors.map(({ message, location, path }) => { return console.log(`[GraphQL error]: Message: ${message}, Location: ${location}, Path: ${path}`) })

  if (networkError) console.log(`[Network error]: ${networkError}`)
})
