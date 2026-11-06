import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Clave de preferencia para activar/desactivar el sonido de escaneo.
 * Se persiste en localStorage y se lee tras el montaje para evitar mismatches
 * de hidratación en SSR (no se accede a window/localStorage durante el render
 * inicial del servidor).
 */
const SCAN_SOUND_PREF_KEY = 'pos:scan-sound-enabled'

type AudioContextConstructor = typeof AudioContext

const getAudioContextCtor = (): AudioContextConstructor | null => {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    AudioContext?: AudioContextConstructor
    webkitAudioContext?: AudioContextConstructor
  }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

export interface UseScanFeedbackOptions {
  /** Estado inicial del sonido antes de leer la preferencia persistida. */
  defaultEnabled?: boolean
}

export interface UseScanFeedback {
  /** Si el sonido está activo (tras leer la preferencia persistida). */
  soundEnabled: boolean
  /** Activa/desactiva el sonido y persiste la preferencia. */
  setSoundEnabled: (enabled: boolean) => void
  /** Alterna el sonido. */
  toggleSound: () => void
  /** Beep breve y agradable de éxito (dos tonos ascendentes). */
  playSuccess: () => void
  /** Beep de error (tono grave corto). */
  playError: () => void
  /** Vibración opcional (si el dispositivo la soporta). No falla si no existe. */
  vibrate: (pattern?: number | number[]) => void
}

/**
 * Retroalimentación de escaneo mediante Web Audio API.
 *
 * - Genera los tonos con un oscilador (sin archivos de audio externos).
 * - Respeta el estado de activación (`soundEnabled`), persistido en localStorage.
 * - Reutiliza un único AudioContext y lo "resume" bajo demanda para cumplir con
 *   las políticas de autoplay de los navegadores (requieren interacción previa).
 * - No lanza errores si AudioContext o navigator.vibrate no están disponibles.
 *
 * @param options - Opciones del hook (p. ej. `defaultEnabled`).
 * @returns API de retroalimentación: soundEnabled, setSoundEnabled, toggleSound,
 *   playSuccess, playError y vibrate.
 */
export const useScanFeedback = (
  options: UseScanFeedbackOptions = {}
): UseScanFeedback => {
  const { defaultEnabled = true } = options
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(defaultEnabled)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Lee la preferencia persistida tras montar (evita mismatch de hidratación).
  useEffect(() => {
    try {
      const raw = globalThis.localStorage?.getItem(SCAN_SOUND_PREF_KEY)
      if (raw !== null && raw !== undefined) {
        setSoundEnabledState(raw === 'true')
      }
    } catch {
      // ignore: sin acceso a localStorage, se queda con el default
    }
  }, [])

  // Libera el AudioContext al desmontar para no dejar recursos de audio vivos.
  useEffect(() => {
    return () => {
      try {
        void audioCtxRef.current?.close()
      } catch {
        // ignore
      }
      audioCtxRef.current = null
    }
  }, [])

  const persistPref = useCallback((enabled: boolean) => {
    try {
      globalThis.localStorage?.setItem(SCAN_SOUND_PREF_KEY, String(enabled))
    } catch {
      // ignore
    }
  }, [])

  const setSoundEnabled = useCallback(
    (enabled: boolean) => {
      setSoundEnabledState(enabled)
      persistPref(enabled)
    },
    [persistPref]
  )

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev
      persistPref(next)
      return next
    })
  }, [persistPref])

  /** Obtiene (o crea perezosamente) el AudioContext compartido. */
  const getContext = useCallback((): AudioContext | null => {
    if (audioCtxRef.current) return audioCtxRef.current
    const Ctor = getAudioContextCtor()
    if (!Ctor) return null
    try {
      audioCtxRef.current = new Ctor()
      return audioCtxRef.current
    } catch {
      return null
    }
  }, [])

  /**
   * Reproduce una secuencia de tonos. Cada tono: { freq, start, duration }.
   * Encadena osciladores con una envolvente de ganancia corta para que el
   * sonido sea nítido y no "clipee".
   */
  const playTones = useCallback(
    (tones: Array<{ freq: number; start: number; duration: number; gain?: number }>) => {
      if (!soundEnabled) return
      const ctx = getContext()
      if (!ctx) return

      // Autoplay policy: reanudar el contexto si quedó suspendido.
      if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => { })
      }

      const now = ctx.currentTime
      for (const tone of tones) {
        try {
          const oscillator = ctx.createOscillator()
          const gainNode = ctx.createGain()
          oscillator.type = 'sine'
          oscillator.frequency.setValueAtTime(tone.freq, now + tone.start)

          const peak = tone.gain ?? 0.08
          gainNode.gain.setValueAtTime(0.0001, now + tone.start)
          gainNode.gain.exponentialRampToValueAtTime(peak, now + tone.start + 0.01)
          gainNode.gain.exponentialRampToValueAtTime(
            0.0001,
            now + tone.start + tone.duration
          )

          oscillator.connect(gainNode)
          gainNode.connect(ctx.destination)
          oscillator.start(now + tone.start)
          oscillator.stop(now + tone.start + tone.duration + 0.02)
        } catch {
          // ignore un tono que falle; no debe romper el flujo de venta
        }
      }
    },
    [soundEnabled, getContext]
  )

  const playSuccess = useCallback(() => {
    // Dos tonos ascendentes, cortos: confirmación agradable.
    playTones([
      { freq: 880, start: 0, duration: 0.08 },
      { freq: 1320, start: 0.09, duration: 0.1 }
    ])
  }, [playTones])

  const playError = useCallback(() => {
    // Tono grave corto: lectura inválida / no encontrado.
    playTones([{ freq: 220, start: 0, duration: 0.18, gain: 0.07 }])
  }, [playTones])

  const vibrate = useCallback((pattern: number | number[] = 40) => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern)
      }
    } catch {
      // ignore: vibración no soportada
    }
  }, [])

  return {
    soundEnabled,
    setSoundEnabled,
    toggleSound,
    playSuccess,
    playError,
    vibrate
  }
}
