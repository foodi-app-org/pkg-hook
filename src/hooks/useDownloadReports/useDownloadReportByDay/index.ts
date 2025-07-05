import { useLazyQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { useState } from 'react'
import { downloadFileFromResponse } from '../helpers/downloadFileFromResponse'



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
export const useDownloadReportByDay = ({
  sendNotification = (
    { description = '', title = '', backgroundColor = 'info' } = {}
  ) => {
    return {
      description,
      title,
      backgroundColor
    }
  }
} = {}) => {
  const [finished, setFinished] = useState(false)
  const [fetchReport, { loading, error }] = useLazyQuery(GET_REPORT_DAY_NUMBER, {
    fetchPolicy: 'network-only',
    onCompleted: async ({ getReportDayNumber }) => {
      setFinished(false)
      try {
        const {
          success,
          data,
          message
        } = getReportDayNumber || {}
        if (!success || !data) {
          setFinished(true)
          return sendNotification({
            description: message,
            title: 'Error al descargar reporte',
            backgroundColor: 'error'
          })
        }
        const { url = '', name = '' } = data
        const response = await fetch(`/api/files/${encodeURIComponent(url)}`)
        await downloadFileFromResponse(response, name)
        setFinished(true)
        return sendNotification({
          description: message ?? 'Reporte descargado exitosamente',
          title: 'Reporte descargado',
          backgroundColor: 'success'
        })
      } catch (e) {
        setFinished(false)
      }
    },
    onError: () => {
      setFinished(true)
    }
  })

  /**
   * Triggers the report download process.
   * @param {number} day - The report day number to fetch.
   */
  const downloadReport = (day: number) => {
    setFinished(false)
    if (!day || typeof day !== 'number') {
      console.warn('Invalid day for report download')
      return
    }
    fetchReport({ variables: { day } })
  }

  return [downloadReport, { loading, error, finished }] as const
}
