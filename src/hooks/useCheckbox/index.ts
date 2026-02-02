import { useCallback, useState } from 'react'

/**
 * Allowed checkbox identifier type
 */
type CheckboxId = string | number

/**
 * Hook for managing multiple checkbox states
 *
 * @template T
 * @param elem - List of all elements
 * @param selectedIds - List of selected element ids
 * @param disabledIds - List of disabled element ids
 * @param setArray - Optional external setter
 * @returns {object} - Checkbox state and handlers
 */
export const useCheckboxState = <T extends CheckboxId>(
  elem: T[],
  selectedIds: T[] = [],
  disabledIds: T[] = [],
  setArray: (items: T[]) => void = () => {}
): {
  checkedItems: Set<T>
  disabledItems: Set<T>
  handleChangeCheck: (event: React.ChangeEvent<HTMLInputElement>, id: T) => void
  toggleAll: () => void
  selectAll: () => void
  clearAll: () => void
  setCheckedItems: React.Dispatch<React.SetStateAction<Set<T>>>
  enableCheckboxes: (...ids: T[]) => void
  disableCheckboxes: (...ids: T[]) => void
  setArray: (items: T[]) => void
} => {
  const numTotalItems = elem?.length ?? 0

  const [checkedItems, setCheckedItems] = useState<Set<T>>(new Set(selectedIds))
  const [disabledItems, setDisabledItems] = useState<Set<T>>(new Set(disabledIds))

  const handleChangeCheck = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, id: T): void => {
      const { checked } = event.target

      setCheckedItems(prevState => {
        const newState = new Set(prevState)
        if (checked) {
          newState.add(id)
        } else {
          newState.delete(id)
        }
        return newState
      })
    },
    []
  )

  const setAll = useCallback(
    (isChecked: boolean): void => {
      setCheckedItems(prevState => {
        const newState = new Set(prevState)

        for (const id of elem) {
          if (disabledItems.has(id)) continue

          if (isChecked) {
            newState.add(id)
          } else {
            newState.delete(id)
          }
        }

        return newState
      })
    },
    [elem, disabledItems]
  )

  const selectAll = useCallback((): void => {
    if (checkedItems.size === numTotalItems) return
    setAll(true)
  }, [checkedItems, numTotalItems, setAll])

  const clearAll = useCallback((): void => {
    if (checkedItems.size === 0) return
    setAll(false)
  }, [checkedItems, setAll])

  const toggleAll = useCallback((): void => {
    const numDisabledAndChecked = [...disabledItems].reduce<number>((count, id) => {
      return checkedItems.has(id) ? count + 1 : count
    }, 0)

    if (checkedItems.size - numDisabledAndChecked === 0) {
      selectAll()
    } else {
      clearAll()
    }
  }, [checkedItems, disabledItems, selectAll, clearAll])

  const enableCheckboxes = useCallback((...ids: T[]): void => {
    setDisabledItems(prevState => {
      const newState = new Set(prevState)
      for (const id of ids) {
        newState.delete(id)
      }
      return newState
    })
  }, [])

  const disableCheckboxes = useCallback((...ids: T[]): void => {
    setDisabledItems(prevState => {
      const newState = new Set(prevState)
      for (const id of ids) {
        newState.add(id)
      }
      return newState
    })
  }, [])

  return {
    checkedItems,
    disabledItems,
    handleChangeCheck,
    toggleAll,
    selectAll,
    clearAll,
    setCheckedItems,
    enableCheckboxes,
    disableCheckboxes,
    setArray
  }
}
