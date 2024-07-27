import { useState } from 'react'

const formatCurrency = (
  prefix,
  amountValue,
  number,
  groupSeparator,
  decimalSeparator,
  allowDecimals = false,
  decimalsLimit = 0
) => {
  if (isNaN(number)) {
    return prefix + '0'
  }

  const amountWithoutDecimals = parseInt(number.toString())
  const decimalIdx = amountValue.indexOf(decimalSeparator)
  const notAllowedChars = new RegExp('[^' + decimalSeparator + '\\d]', 'g')
  const decimalsWithSeparator =
    decimalIdx >= 0
      ? amountValue
        .slice(decimalIdx, amountValue.length)
        .replace(notAllowedChars, '')
        .slice(0, decimalsLimit + 1)
      : ''

  return (
    prefix +
    amountWithoutDecimals
      .toString()
      .replace(/\B(?=(\d{3}){1,5}(?!\d))/g, groupSeparator) +
    decimalsWithSeparator
  )
}

const processInputValue = (input, decimalSeparator) => {
  const decimalRegex = new RegExp('[' + decimalSeparator + ']', 'g')
  const notAllowedChars = new RegExp('[^' + decimalSeparator + '\\d¬]', 'g')

  return parseFloat(
    input
      .replace(decimalRegex, '¬')
      .replace(notAllowedChars, '')
      .replace('¬', '.')
  )
}
/**
 * Truncate excess decimals from a number based on a limit.
 *
 * @param {number} number The number to truncate.
 * @param {number} decimalsLimit The maximum number of decimal places allowed.
 * @returns {number} The number with truncated decimals.
 */
const truncateDecimals = (number, decimalsLimit) => {
  if (isNaN(number)) {
    return 0;
  }

  const multiplier = Math.pow(10, decimalsLimit);
  return Math.floor(number * multiplier) / multiplier;
};
export const useAmountInput = props => {
  const {
    onChange = () => {},
    prefix = '$',
    groupSeparator = '.',
    decimalSeparator = ',',
    allowDecimals,
    decimalsLimit,
    defaultValue
  } = props

  const inputVal = defaultValue ?? ''
  const [inputValue, setInputValue] = useState(inputVal)

  const preProcess = amount => {
    const amountValue = amount.trim()
    const oldInputValue = inputValue

    if (oldInputValue !== amountValue) {
      const amountFloatValue = processInputValue(amount, decimalSeparator)
      let inputValue = ''
      // This allows for people to use `.` but still input decimals
      const isAboutToIntroduceDecimals =
        oldInputValue + decimalSeparator === amountValue ||
        oldInputValue + '.' === amountValue
      if (allowDecimals === true && isAboutToIntroduceDecimals) {
        inputValue = oldInputValue + decimalSeparator
      } else if (
        (allowDecimals === false || allowDecimals === undefined) &&
        isAboutToIntroduceDecimals
      ) {
        inputValue = oldInputValue
      } else {
        inputValue = formatCurrency(
          prefix,
          amountValue,
          amountFloatValue,
          groupSeparator,
          decimalSeparator,
          allowDecimals,
          decimalsLimit
        )
      }
      console.log(inputValue)
      setInputValue(inputValue)

      const callbackValue = isNaN(amountFloatValue) ? 0 : amountFloatValue
      if (typeof onChange === 'function') {
        onChange(truncateDecimals(callbackValue, decimalsLimit))
      }
    }
  }
  return {
    inputValue,
    preProcess
  }
}
