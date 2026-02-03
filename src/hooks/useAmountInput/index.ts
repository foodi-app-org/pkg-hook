import { useState } from 'react'

const formatCurrency = (
  prefix: string,
  amountValue: string,
  number: number,
  groupSeparator: string,
  decimalSeparator: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allowDecimals: boolean = false,
  decimalsLimit: number = 0
): string => {
  if (Number.isNaN(number)) {
    return prefix + '0'
  }

  const amountWithoutDecimals = Number.parseInt(number.toString())
  const decimalIdx = amountValue.indexOf(decimalSeparator)
  const notAllowedChars = new RegExp(String.raw`[^${decimalSeparator}\d]`, 'g')
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
      .replaceAll(/\B(?=(\d{3}){1,5}(?!\d))/g, groupSeparator) +
    decimalsWithSeparator
  )
}

const processInputValue = (input: string, decimalSeparator: string): number => {
  const decimalRegex = new RegExp('[' + decimalSeparator + ']', 'g')
  const notAllowedChars = new RegExp(String.raw`[^${decimalSeparator}\d¬]`, 'g')

  return Number.parseFloat(
    input
      .replaceAll(decimalRegex, '¬')
      .replaceAll(notAllowedChars, '')
      .replaceAll('¬', '.')
  )
}
/**
 * Truncate excess decimals from a number based on a limit.
 *
 * @param number The number to truncate.
 * @param decimalsLimit The maximum number of decimal places allowed.
 * @returns The number with truncated decimals.
 */
const truncateDecimals = (number: number, decimalsLimit: number): number => {
  if (Number.isNaN(number)) {
    return 0
  }

  const multiplier = Math.pow(10, decimalsLimit)
  return Math.floor(number * multiplier) / multiplier
}
export interface UseAmountInputProps {
  onChange?: (value: number) => void
  prefix?: string
  groupSeparator?: string
  decimalSeparator?: string
  allowDecimals?: boolean
  decimalsLimit?: number
  defaultValue?: string
}

export const useAmountInput = (props: UseAmountInputProps) => {
  const {
    onChange = () => {},
    prefix = '$',
    groupSeparator = '.',
    decimalSeparator = ',',
    allowDecimals = false,
    decimalsLimit = 0,
    defaultValue
  } = props

  const inputVal = defaultValue ?? ''
  const [inputValue, setInputValue] = useState(inputVal)

  const preProcess = (amount: string) => {
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
      setInputValue(inputValue)

      const callbackValue = Number.isNaN(amountFloatValue) ? 0 : amountFloatValue
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
