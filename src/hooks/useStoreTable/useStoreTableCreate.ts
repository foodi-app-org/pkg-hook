import { useMutation } from '@apollo/client'
import { useState } from 'react'

import { CREATE_TABLE_MUTATION } from './queries'

import type { SendNotificationFn } from 'typesdefs'



export interface StoreTableCreateResult {
  data: {
    storeTableCreate: {
      success: boolean
      message?: string
    }
  }
}

export const useStoreTableCreate = ({
  sendNotification = () => {}
}: { sendNotification?: SendNotificationFn } = {}) => {
  const [loading, setLoading] = useState(false)
  const [createTableMutation] = useMutation(CREATE_TABLE_MUTATION)

  const storeTableCreate = async (
    tableName: string,
    seats: number,
    section: string,
    tableState: number
  ): Promise<StoreTableCreateResult | { success: false; message: string }> => {
    setLoading(true)
    try {
      const result = await createTableMutation({
        variables: {
          tableName,
          seats,
          section,
          tableState
        },
        update (cache, { data }) {
          if (data?.storeTableCreate?.success) {
            cache.modify({
              fields: {
                storeTables (existingTables = []) {
                  const newTableRef = {
                    tableId: null,
                    tableName,
                    seats,
                    section,
                    tableState: 1
                  }
                  return [...existingTables, newTableRef]
                }
              }
            })
          }
        }
      })

      if (result.data && result.data.storeTableCreate) {
        sendNotification({
          backgroundColor: result.data.storeTableCreate.success ? 'success' : 'error',
          description: result.data.storeTableCreate.message || '',
          title: result.data.storeTableCreate.success ? 'Success' : 'Error'
        })
        return { data: result.data } as StoreTableCreateResult
      } else {
        sendNotification({
          backgroundColor: 'error',
          description: 'No data returned from mutation.',
          title: 'Error'
        })
        return { success: false, message: 'No data returned from mutation.' }
      }
    } catch (error: unknown) {
      let message = 'Error occurred while creating the table.'
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        message = (error as { message: string }).message
      }
      sendNotification({
        backgroundColor: 'error',
        description: message,
        title: 'Creation Failed'
      })
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  return [storeTableCreate, { loading }] as const
}
