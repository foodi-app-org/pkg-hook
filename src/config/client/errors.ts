import { onError } from '@apollo/client/link/error'

interface GraphQLErrorExtension {
  code?: string
  message?: string
}

interface GraphQLErrorItem {
  extensions?: GraphQLErrorExtension
}

interface ErrorWithErrors {
  errors?: GraphQLErrorItem[]
}

export const errorHandler = (error: ErrorWithErrors | null | undefined): boolean | null => {
  let logout: boolean | null = null
  if (error && Array.isArray(error?.errors)) {
    error.errors?.length && error?.errors?.forEach((err: GraphQLErrorItem) => {
      if (err?.extensions) {
        const { code, message }: GraphQLErrorExtension = err?.extensions || {}
        if (code === 'UNAUTHENTICATED' || code === 'FORBIDDEN') {
          logout = true
          return {
            status: 'FORBIDDEN',
            message
          }
        }
      }
    })
  }
  return logout
}

export const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)graphQLErrors.map(({ message, path }) => { return console.log(`[GraphQL error]: Message: ${message}, Path: ${path}`) })

  if (networkError) console.log(`[Network error]: ${networkError}`)
})
