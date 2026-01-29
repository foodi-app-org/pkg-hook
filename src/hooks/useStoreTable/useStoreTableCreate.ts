import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { CREATE_TABLE_MUTATION } from './queries'

/**
 * Custom hook to handle table creation with validation and mutation logic
 * @param {string} tableName Name of the table
 * @param {number} seats Number of seats at the table
 * @param {string} section Section where the table is located
 * @param {number} tableState Current state of the table (e.g., Active, Occupied)
 * @returns {Object} The state of the mutation including success, message, errors, and data
 */
export const useStoreTableCreate = ({
  sendNotification = () => {}
} = {}) => {
  const [loading, setLoading] = useState(false)
  const [createTableMutation] = useMutation(CREATE_TABLE_MUTATION)
  /**
   * Function to create a table with validation and mutation
   * @param {string} tableName Table name
   * @param {number} seats Number of seats
   * @param {string} section Table section
   * @param {number} tableState Table state (e.g., 0 = Unavailable, 1 = Active, 2 = Occupied)
   */
  const storeTableCreate = async (tableName, seats, section, tableState) => {
    setLoading(true) // Start loading
    try {
      // Call the mutation to create the table
      const result = await createTableMutation({
        variables: {
          tableName,
          seats,
          section,
          tableState
        },
        update (cache, { data: { storeTableCreate } }) {
          if (storeTableCreate.success) {
            // Actualizar la lista de mesas en la caché
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

      sendNotification({
        backgroundColor: result.data.storeTableCreate.success ? 'success' : 'error',
        description: result.data.storeTableCreate.message || '',
        title: result.data.storeTableCreate.success ? 'Success' : 'Error'
      })
      return result
    } catch (error) {
      sendNotification({
        backgroundColor: 'error',
        description: error.message || 'Error occurred while creating the table.',
        title: 'Creation Failed'
      })
      return { success: false, message: error.message }
    } finally {
      setLoading(false)
    }
  }

  return [storeTableCreate, { loading }]
}
