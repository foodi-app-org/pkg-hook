export enum ConfigurationScope {
  APP = 'APP',
  STORE = 'STORE',
  USER = 'USER'
}

export enum ConfigurationEventType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  RESET = 'RESET'
}

export interface ConfigurationIdentity {
  scope: ConfigurationScope
  componentName: string
  key: string
}

export interface UpsertConfigurationInput
  extends ConfigurationIdentity {
  value: unknown
  description?: string | null
}

export interface AppConfiguration {
  id: string
  scope: ConfigurationScope
  componentName: string
  key: string
  value: unknown
  description?: string | null
  version: number
  createdAt?: string
  updatedAt?: string
}

export interface ResolvedConfiguration {
  componentName: string
  key: string
  value: unknown
  sourceScope: ConfigurationScope
  version: number
  updatedAt?: string
}

export interface ConfigurationMutationResponse {
  success: boolean
  message: string
  data: AppConfiguration | null
}

export interface ConfigurationEvent {
  id: string
  configurationId?: string | null
  scope: ConfigurationScope
  componentName: string
  key: string
  eventType: ConfigurationEventType
  previousValue?: unknown
  newValue?: unknown
  actorId?: string | null
  correlationId?: string | null
  createdAt?: string
}