import { useEffect, useState } from 'react'

const DATE_UNITS: [unit: Intl.RelativeTimeFormatUnit, secondsInUnit: number][] = [
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1]
]

type DateDiff = { value: number; unit: Intl.RelativeTimeFormatUnit }

const getDateDiffs = (timestamp: number): DateDiff | undefined => {
  const now = Date.now()
  const elapsed = (timestamp - now) / 1000

  for (const [unit, secondsInUnit] of DATE_UNITS) {
    if (Math.abs(elapsed) > secondsInUnit || unit === 'second') {
      const value = Math.round(elapsed / secondsInUnit)
      return { value, unit }
    }
  }
  return undefined
}

export const useTimeAgo = (timestamp: number) => {
  const [timeAgo, setTimeAgo] = useState<DateDiff | undefined>(() => getDateDiffs(timestamp))

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeAgo = getDateDiffs(timestamp)
      setTimeAgo(newTimeAgo)
    }, 5000)

    return () => { return clearInterval(interval) }
  }, [timestamp])

  const rtf = new Intl.RelativeTimeFormat('es', { style: 'short' })

  return rtf?.format(timeAgo?.value ?? 0, (timeAgo?.unit ?? 'second'))
}
