import { randomNumber } from './helpers'
import { BACKGROUND_COLORS, TEXT_COLORS } from './helpers/colors'

export const useColorByLetters = ({
  value = ''
} = {
  value: ''
}) => {
  const key = randomNumber({ value, min: 0, max: 19 })

  const getCustomColors = (text) => {
    const key = randomNumber({ text, min: 0, max: 19 })
    return {
      key,
      color: TEXT_COLORS[key],
      borderColor: TEXT_COLORS[key],
      bgColor: BACKGROUND_COLORS[key]
    }
  }
  return {
    key,
    color: TEXT_COLORS[key],
    borderColor: TEXT_COLORS[key],
    bgColor: BACKGROUND_COLORS[key],
    getCustomColors
  }
}
