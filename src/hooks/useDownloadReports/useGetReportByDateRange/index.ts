import { useLazyQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { downloadFileFromResponse } from '../helpers/downloadFileFromResponse'
import { useState } from 'react'

/**
 * GraphQL query to get report by date range
 */
const GET_REPORT_BY_DATE_RANGE = gql`
  query getReportByDateRange($startDate: DateTime!, $endDate: DateTime!) {
    getReportBydateRange(startDate: $startDate, endDate: $endDate) {
      success
      message
      errors {
        path
        message
        type
      }
      data {
        id
        name
        description
        url
        createdAt
      }
    }
  }
`

/**
 * Custom hook to fetch report by a date range
 * @param {Object} options
 * @param {Function} options.sendNotification - Function to notify user
 * @returns {[Function, { loading: boolean, error: any, data: any }]}
 */
export const useGetReportByDateRange = ({
  sendNotification = ({ description = '', title = '', backgroundColor = 'info' } = {}) => {
    return { description, title, backgroundColor }
  }
} = {}) => {
  const [loading, setLoading] = useState(false)
  const [finished, setFinished] = useState(false)

  const [getReportQuery, { data, error }] = useLazyQuery(GET_REPORT_BY_DATE_RANGE, {
    onCompleted: () => {
      setFinished(true)
    }
  })

  /**
   * Triggers the report generation and handles download
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<any>}
   */
  const getReport = async (startDate, endDate) => {
    try {
      setLoading(true)
      const response = await getReportQuery({
        variables: { startDate, endDate },
        fetchPolicy: 'network-only'
      })

      const reportResult = response?.data?.getReportBydateRange ?? {
        success: false,
        message: 'No report data found',
        data: null
      }

      if (!reportResult) {
        setLoading(false)
        return {
          success: false,
          message: 'No report data found',
          data: null
        }
      }

      const {
        success,
        message,
        data
      } = reportResult

      sendNotification({
        description: message,
        title: success ? 'Success' : 'Error',
        backgroundColor: success ? 'success' : 'error'
      })

      if (success && data?.url && data?.name) {
        setLoading(true)
        const res = await fetch(`/api/files/${encodeURIComponent(data.url)}`)
        await downloadFileFromResponse(res, data.name)
        setLoading(false)
      }
      return reportResult
    } catch (err) {
      setLoading(false)
      sendNotification({
        description: err.message || 'Unexpected error',
        title: 'Error',
        backgroundColor: 'error'
      })
      return { success: false, message: err.message, data: null }
    }
  }

  return [getReport, {
    loading,
    error,
    finished,
    data: data?.getReportBydateRange
  }]
}
