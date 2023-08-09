import { useEffect, useRef } from "react"

export const useAnimationFrame = (callback, start, end, duration = 1000) => {
    const functionRef = useRef()
    const delta = Math.abs(start - end)
    const frameCount = Math.ceil(60 * (duration / 1000))
    const iteration = useRef(frameCount)
    useEffect(() => {
      const animate = (rafId) => {
        if (iteration.current <= 0) {
          cancelAnimationFrame(rafId)
          iteration.current = frameCount
        }
  
        callback(Math.max(delta / iteration.current, 1))
        iteration.current--
      }
  
      if (delta > 0) functionRef.current = requestAnimationFrame(animate)
  
      return () => {return cancelAnimationFrame(functionRef.current)}
    }, [callback, delta, frameCount, iteration])
  }

  // const Counter = ({ numeral = 0 }) => {
  //   const [currentValue, setCurrentValue] = useState(0)
  //   const fxOperator = currentValue > numeral ? 'subtraction' : 'addition'

  //   useAnimationFrame(
  //     (diffValue) => {
  //       // Pass on a function to the setter of the state
  //       // to make sure we always have the latest state
  //       setCurrentValue((prevCount) => {
  //         return fxOperator === 'addition'
  //           ? prevCount + diffValue
  //           : prevCount - diffValue
  //       }
  //       )
  //     },
  //     currentValue,
  //     numeral,
  //     300
  //   )
  //   return <>{new Intl.NumberFormat().format(Math.round(currentValue))}</>
  // }