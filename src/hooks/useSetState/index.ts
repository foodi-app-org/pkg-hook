import { useEffect, useState } from 'react'

export const useSetState = (initialState: number) => {
  const [state, setState] = useState(initialState)
  const increase = () => { return setState(state + 1) }
  const decrease = () => { return setState(state - 1) }
  const reset = () => { return setState(0) }
  useEffect(() => {
    if (state === -1) {
      reset()
    }
    // No cleanup needed, so return void
  }, [state])
  // Cambio de estado
  const changeState = () => {
    setState(state === 0 ? 1 : 0)
  }
  return {
    state,
    increase,
    decrease,
    reset,
    changeState,
    setState
  }
}
