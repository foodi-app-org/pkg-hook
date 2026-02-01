import { useEffect, useState } from 'react'

const defaultSettings = {
  enableHighAccuracy: false,
  timeout: Infinity,
  maximumAge: 0
}

type GeolocationPosition = {
  coords: {
    latitude: number
    longitude: number
    accuracy: number
    speed: number | null
  }
  timestamp: number
}

type GeolocationPositionError = {
  code: number
  message: string
}

export const usePosition = (watch = false, settings = defaultSettings) => {
  const [position, setPosition] = useState<Partial<GeolocationPosition['coords']> & { timestamp?: number }>({})
  const [error, setError] = useState<string | null>(null)

  const onChange = ({ coords, timestamp }: GeolocationPosition) => {
    setPosition({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      speed: coords.speed,
      timestamp
    })
  }

  const onError = (err: GeolocationPositionError) => {
    setError(err.message)
  }

  useEffect(() => {
    if (!navigator || !navigator.geolocation) {
      setError('Geolocation is not supported')
      return
    }

    let watcher: number | null = null
    if (watch) {
      watcher = navigator.geolocation.watchPosition(
        onChange,
        onError,
        settings
      )
    } else {
      navigator.geolocation.getCurrentPosition(onChange, onError, settings)
    }

    // Cleanup function for useEffect
    if (watcher !== null) {
      navigator.geolocation.clearWatch(watcher)
    }
  }, [
    settings,
    settings.enableHighAccuracy,
    settings.timeout,
    settings.maximumAge,
    watch
  ])

  return { ...position, error }
}
