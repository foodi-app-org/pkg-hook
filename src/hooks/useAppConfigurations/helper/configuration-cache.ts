
import { ApolloCache } from '@apollo/client'



import { GET_CONFIGURATION, GET_RESOLVED_CONFIGURATION } from '../graphql/queries'
import {
  AppConfiguration,
  ConfigurationIdentity,
  ConfigurationScope
} from '../types/configuration.types'

const PRIORITY: Record<ConfigurationScope, number> = {
  [ConfigurationScope.APP]: 1,
  [ConfigurationScope.STORE]: 2,
  [ConfigurationScope.USER]: 3
}

/**
 * Updates the exact configuration query.
 *
 * Also updates the resolved query only when the new scope
 * has sufficient priority over the cached current value.
 * @param cache
 * @param configuration
 */
export const writeConfigurationCache = (
  cache: ApolloCache<unknown>,
  configuration: AppConfiguration
) => {
  const identity: ConfigurationIdentity = {
    scope: configuration.scope,
    componentName: configuration.componentName,
    key: configuration.key
  }

  // 1. Update exact scoped configuration.
  cache.writeQuery({
    query: GET_CONFIGURATION,
    variables: identity,
    data: {
      getConfiguration: configuration
    }
  })

  // 2. Check whether the resolved value is already cached.
  const resolved = cache.readQuery<{
    getResolvedConfiguration: {
      sourceScope: ConfigurationScope
      value: unknown
      version: number
      componentName: string
      key: string
      updatedAt?: string
    } | null
  }>({
    query: GET_RESOLVED_CONFIGURATION,
    variables: {
      componentName: configuration.componentName,
      key: configuration.key
    }
  })

  // If there is no resolved cache yet, leave it uninitialized.
  // The first active query will resolve the precedence on the server.
  if (!resolved) return

  const current = resolved.getResolvedConfiguration

  const newPriority = PRIORITY[configuration.scope]

  const currentPriority = current
    ? PRIORITY[current.sourceScope]
    : 0

  // Only update if the incoming value has greater or equal priority.
  if (newPriority >= currentPriority) {
    cache.writeQuery({
      query: GET_RESOLVED_CONFIGURATION,
      variables: {
        componentName: configuration.componentName,
        key: configuration.key
      },
      data: {
        getResolvedConfiguration: {
          componentName: configuration.componentName,
          key: configuration.key,
          value: configuration.value,
          sourceScope: configuration.scope,
          version: configuration.version,
          updatedAt: configuration.updatedAt
        }
      }
    })
  }

  // 3. Existing normalized AppConfiguration references
  // are also updated by Apollo through their id.
}
