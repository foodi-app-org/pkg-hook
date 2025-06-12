import { useLazyQuery, useMutation } from '@apollo/client'
import { gql } from '@apollo/client'
import { get } from 'lodash'

/**
 * GraphQL mutation to get report by date range
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
 * @returns {{
 *   getReport: Function,
 *   loading: boolean,
 *   error: any,
 *   data: any
 * }}
 */
export const useGetReportByDateRange = () => {
    const [getReportMutation, { data, loading, error }] = useLazyQuery(GET_REPORT_BY_DATE_RANGE)

    /**
     * Triggers the report generation
     * @param {string} startDate - ISO string (e.g., 2025-06-05)
     * @param {string} endDate - ISO string (e.g., 2025-06-12)
     * @returns {Promise<any>}
     */
    const getReport = async (startDate, endDate) => {
        const res = await getReportMutation({
            variables: { startDate, endDate }
        })
        return res?.data?.getReportBydateRange
    }

    return [getReport, {
        loading,
        error,
        data: data?.getReportBydateRange
    }]
}
