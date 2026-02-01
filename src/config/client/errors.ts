import { onError } from '@apollo/client/link/error'

interface GraphQLErrorExtension {
  code?: string
  message?: string
}

interface GraphQLErrorItem {
  extensions?: GraphQLErrorExtension
}

export interface ErrorWithErrors {
  errors?: GraphQLErrorItem[]
}

export const errorHandler = (error: ErrorWithErrors | null | undefined): boolean | null => {
  let logout: boolean | null = null
  if (error && Array.isArray(error?.errors)) {
    for (const err of error.errors) {
      if (err?.extensions) {
        const { code } = err.extensions
        if (code === 'UNAUTHENTICATED' || code === 'FORBIDDEN') {
          logout = true
          break
        }
      }
    }
  }
  return logout
}

export const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Path: ${path}`)
    })
  }

  if (networkError) console.error(`[Network error]: ${networkError}`)
})
