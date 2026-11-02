/**
 * Public types for the report export hooks. Mirror the backend GraphQL types so
 * consumers (the admin frontend) get full typing without importing from the
 * server package.
 */

/** Export output format. */
export type ReportFormat = 'XLSX' | 'CSV'

/** Report job lifecycle status. */
export type ReportJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'

/** A selectable value for a dynamic filter. */
export interface ReportFilterOption {
  value: string
  label: string
}

/** Definition of a dynamic filter available for a report. */
export interface ReportFilterDefinition {
  key: string
  label: string
  type: string
  multiple: boolean
  options?: ReportFilterOption[] | null
}

/** A column produced by a report. */
export interface ReportFieldDefinition {
  key: string
  label: string
  type: string
}

/** A report available in the catalog. */
export interface ReportDefinition {
  id: string
  name: string
  description: string
  category: string
  enabled: boolean
  disabledReason?: string | null
  supportedFormats: ReportFormat[]
  supportsMultipleSelection: boolean
  filters: ReportFilterDefinition[]
  availableFields: ReportFieldDefinition[]
}

/** A catalog category grouping its reports. */
export interface ReportCatalogCategory {
  category: string
  label: string
  reports: ReportDefinition[]
}

/** Per-report filter values keyed by filter key. */
export type ReportFilterValues = Record<string, string | string[]>

/** Input for an export request. */
export interface ReportExportInput {
  reportIds: string[]
  format: ReportFormat
  startDate: string
  endDate: string
  timezone?: string
  filters?: Record<string, ReportFilterValues>
}

/** A persisted report job. */
export interface ReportJob {
  id: string
  reportIds: string[]
  format: ReportFormat
  startDate: string
  endDate: string
  timezone: string
  status: ReportJobStatus
  progress: number
  stage?: string | null
  recordsProcessed?: number | null
  fileName?: string | null
  fileSize?: number | null
  mimeType?: string | null
  errorMessage?: string | null
  attempts: number
  createdAt: string
  startedAt?: string | null
  finishedAt?: string | null
  durationMs?: number | null
  expiresAt?: string | null
}

/** Structured error entry returned by mutations. */
export interface ReportErrorEntry {
  path?: string | null
  message?: string | null
  type?: string | null
}

/** Payload streamed by the report job subscription. */
export interface ReportJobUpdate {
  jobId: string
  status: ReportJobStatus
  progress: number
  stage?: string | null
  fileName?: string | null
  errorMessage?: string | null
  event: string
}

/** Notification callback shape used across the app. */
export type SendNotification = (opts?: {
  title?: string
  description?: string
  backgroundColor?: string
}) => void
