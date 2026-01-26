import { Cookies } from '../../../cookies'
import { SalesState } from '../types'
import { initialStateSales } from './constants'

/**
 * Initializes sales state from cookies or fallback state
 */
export const initializer = (
  initialValue: SalesState = initialStateSales
): SalesState => {
  try {
    const raw = Cookies.get(process.env.LOCAL_SALES_STORE)

    if (!raw) return initialValue

    return JSON.parse(raw) as SalesState
  } catch {
    return initialValue
  }
}
