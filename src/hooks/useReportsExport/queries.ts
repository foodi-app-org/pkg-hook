import { gql } from '@apollo/client'

/**
 * Shared fragment with every field of a report job used across the hooks.
 */
export const REPORT_JOB_FIELDS = gql`
  fragment ReportJobFields on ReportJob {
    id
    reportIds
    format
    startDate
    endDate
    timezone
    status
    progress
    stage
    recordsProcessed
    fileName
    fileSize
    mimeType
    errorMessage
    attempts
    createdAt
    startedAt
    finishedAt
    durationMs
    expiresAt
  }
`

/**
 * Query for the backend-owned dynamic report catalog.
 */
export const GET_AVAILABLE_REPORTS = gql`
  query GetAvailableReports {
    getAvailableReports {
      success
      message
      categories {
        category
        label
        reports {
          id
          name
          description
          category
          enabled
          disabledReason
          supportedFormats
          supportsMultipleSelection
          filters {
            key
            label
            type
            multiple
            options {
              value
              label
            }
          }
          availableFields {
            key
            label
            type
          }
        }
      }
    }
  }
`

/**
 * Mutation that validates and submits an export request.
 */
export const REQUEST_REPORT_EXPORT = gql`
  ${REPORT_JOB_FIELDS}
  mutation RequestReportExport($input: ReportExportInput!) {
    requestReportExport(input: $input) {
      success
      message
      errors {
        path
        message
        type
      }
      job {
        ...ReportJobFields
      }
    }
  }
`

/**
 * Query returning the authenticated user's most recent report requests.
 */
export const GET_RECENT_REPORT_REQUESTS = gql`
  ${REPORT_JOB_FIELDS}
  query GetRecentReportRequests($limit: Int) {
    getRecentReportRequests(limit: $limit) {
      success
      message
      jobs {
        ...ReportJobFields
      }
    }
  }
`

/**
 * Query returning a single owned job's current status.
 */
export const GET_REPORT_JOB_STATUS = gql`
  ${REPORT_JOB_FIELDS}
  query GetReportJobStatus($jobId: ID!) {
    getReportJobStatus(jobId: $jobId) {
      success
      message
      job {
        ...ReportJobFields
      }
    }
  }
`

/**
 * Query resolving the downloadable file name for a completed job.
 */
export const DOWNLOAD_REPORT = gql`
  query DownloadReport($jobId: ID!) {
    downloadReport(jobId: $jobId) {
      success
      message
      fileName
      mimeType
    }
  }
`

/**
 * Mutation cancelling an unfinished owned job.
 */
export const CANCEL_REPORT_JOB = gql`
  ${REPORT_JOB_FIELDS}
  mutation CancelReportJob($jobId: ID!) {
    cancelReportJob(jobId: $jobId) {
      success
      message
      job {
        ...ReportJobFields
      }
    }
  }
`

/**
 * Mutation retrying a failed owned job as a new request.
 */
export const RETRY_REPORT_JOB = gql`
  ${REPORT_JOB_FIELDS}
  mutation RetryReportJob($jobId: ID!) {
    retryReportJob(jobId: $jobId) {
      success
      message
      job {
        ...ReportJobFields
      }
    }
  }
`

/**
 * Subscription streaming job lifecycle updates for a specific job id.
 */
export const REPORT_JOB_UPDATED = gql`
  subscription ReportJobUpdated($jobId: String!) {
    reportJobUpdated(jobId: $jobId) {
      jobId
      status
      progress
      stage
      fileName
      errorMessage
      event
    }
  }
`
