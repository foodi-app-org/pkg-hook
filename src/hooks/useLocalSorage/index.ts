import { useState } from 'react'

/**
 *
 * @param key
 * @param initialValue
 * @returns returns a stateful value, and a function to update it.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // const { setAlertBox } = useContext(Context)
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = globalThis.localStorage.getItem(key)
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) as T : initialValue
    } catch {
      // If error also return initialValue
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        typeof value === 'function' ? (value as (val: T) => T)(storedValue) : value
      // Save state
      setStoredValue(valueToStore)
      // Save to local storage
      globalThis.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch {
      // A more advanced implementation would handle the error case
    }
  }

  return [storedValue, setValue] as const
}
