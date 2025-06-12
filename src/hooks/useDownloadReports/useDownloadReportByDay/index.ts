import { useLazyQuery } from '@apollo/client'
import { gql } from '@apollo/client'


const downloadFileFromResponse = async (response, fileName) => {
  try {
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading file:', error)
    throw error
  }

}
/**
 * GraphQL query to get the report for a specific day.
 */
const GET_REPORT_DAY_NUMBER = gql`
  query getReportDayNumber($day: Int!) {
    getReportDayNumber(day: $day) {
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
 * Custom hook to trigger the report download when the GraphQL query resolves.
 *
 * @returns {{
 *   downloadReport: (day: number) => void,
 *   loading: boolean,
 *   error: Error | undefined
 * }} Object containing the trigger function, loading state and error.
 */
export const useDownloadReportByDay = () => {
  const [fetchReport, { loading, error }] = useLazyQuery(GET_REPORT_DAY_NUMBER, {
    fetchPolicy: 'network-only',
    onCompleted: async ({ getReportDayNumber }) => {
      const { success, data, message } = getReportDayNumber || {}
      const {
        url = '',
        name
      } = data ?? {
        url: '',
        name: ''
      }
      const response = await fetch(`/api/files/${encodeURIComponent(url)}`)
      await downloadFileFromResponse(response, name)
    }
  })

  /**
   * Triggers the report download process.
   * @param {number} day - The report day number to fetch.
   */
  const downloadReport = (day) => {
    if (!day || typeof day !== 'number') {
      console.warn('Invalid day for report download')
      return
    }

    fetchReport({ variables: { day } })
  }

  return [downloadReport, { loading, error }]
}
