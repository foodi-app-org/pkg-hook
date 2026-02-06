// hooks/useLoading.tsx
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Options for useLoading
 */
export type UseLoadingOptions = {
  /** Delay before showing loader (ms). Helps avoid flicker for very fast ops. */
  delayMs?: number
  /** Minimum time loader should stay visible once shown (ms). */
  minDurationMs?: number
  /** Initial visible state */
  initial?: boolean
  /** If true, logs warnings when stop() is called more times than start() */
  warnOnMismatch?: boolean
}

/**
 * Result of useLoading
 */
export type UseLoadingResult = {
  loading: boolean
  start: (key?: string) => number
  stop: (key?: string) => number
  wrap: <T>(fn: () => Promise<T>, key?: string) => Promise<T>
  count: () => number
  isLoadingFor: (key?: string) => boolean
}

/* ---------- constants & helpers ---------- */
const DEFAULT_KEY = '__default_loader'
const clamp = (v: unknown, fallback: number) =>
  typeof v === 'number' && isFinite(v) && v >= 0 ? v : fallback

type Timer = ReturnType<typeof setTimeout> | null

/* ---------- hook implementation ---------- */
/**
 * useLoading
 *
 * - Backwards compatible with original API.
 * - Supports optional per-key loaders without breaking previous uses.
 * - Batches visible state updates via requestAnimationFrame to reduce re-renders.
 * - Ensures min duration per shown key and cleans timers on unmount.
 * - Warns on start/stop mismatches if enabled.
 * @param opts UseLoadingOptions
 * @returns UseLoadingResult
 */
export const useLoading = (opts: UseLoadingOptions = {}): UseLoadingResult => {
  const delayMs = clamp(opts.delayMs, 150)
  const minDurationMs = clamp(opts.minDurationMs, 300)
  const mountedRef = useRef(true)
  const warnOnMismatch = Boolean(opts.warnOnMismatch ?? true)

  // state exposed to components (minimize re-renders by setting only when necessary)
  const [visible, setVisible] = useState<boolean>(Boolean(opts.initial ?? false))

  // internal structures (per-key)
  const countersRef = useRef<Map<string, number>>(new Map())
  const delayTimersRef = useRef<Map<string, Timer>>(new Map())
  const minTimersRef = useRef<Map<string, Timer>>(new Map())
  const shownAtRef = useRef<Map<string, number | null>>(new Map())

  // batching flag for rAF
  const rafScheduledRef = useRef<boolean>(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // clear all timers
      for (const t of delayTimersRef.current.values()) if (t) clearTimeout(t)
      for (const t of minTimersRef.current.values()) if (t) clearTimeout(t)
      delayTimersRef.current.clear()
      minTimersRef.current.clear()
      countersRef.current.clear()
      shownAtRef.current.clear()
    }
     
  }, [])

  /* compute total shown (any key with shownAt != null) */
  const computeAnyShown = useCallback(() => {
    for (const v of shownAtRef.current.values()) {
      if (v) return true
    }
    return false
  }, [])

  /* schedule flush to update visible state in a single rAF */
  const scheduleFlush = useCallback(() => {
    if (rafScheduledRef.current) return
    rafScheduledRef.current = true
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        rafScheduledRef.current = false
        if (!mountedRef.current) return
        const shouldBeVisible = computeAnyShown()
        setVisible((prev) => (prev === shouldBeVisible ? prev : shouldBeVisible))
      })
    } else {
      // fallback
      setTimeout(() => {
        rafScheduledRef.current = false
        if (!mountedRef.current) return
        const shouldBeVisible = computeAnyShown()
        setVisible((prev) => (prev === shouldBeVisible ? prev : shouldBeVisible))
      }, 0)
    }
  }, [computeAnyShown])

  /* helpers to clear per-key timers safely */
  const clearTimerMap = useCallback((map: Map<string, Timer>, key: string) => {
    const t = map.get(key)
    if (t) clearTimeout(t)
    map.delete(key)
  }, [])

  /* Start loader for a key (default key if omitted) */
  const start = useCallback(
    (key = DEFAULT_KEY) => {
      const cur = countersRef.current.get(key) ?? 0
      const next = cur + 1
      countersRef.current.set(key, next)

      // if first caller, schedule show after delay
      if (next === 1) {
        clearTimerMap(delayTimersRef.current, key)
        const t = setTimeout(() => {
          // set shown timestamp and clear any minTimer (we'll manage min on stop)
          shownAtRef.current.set(key, Date.now())
          clearTimerMap(minTimersRef.current, key)
          scheduleFlush()
        }, Math.max(0, delayMs))
        delayTimersRef.current.set(key, t)
      } else {
        // no scheduling change; still trigger potential flush to sync visible if necessary
        scheduleFlush()
      }

      return next
    },
    [clearTimerMap, delayMs, scheduleFlush]
  )

  /* Stop loader for a key */
  const stop = useCallback(
    (key = DEFAULT_KEY) => {
      const cur = countersRef.current.get(key) ?? 0
      const next = Math.max(0, cur - 1)
      countersRef.current.set(key, next)

      // if no active callers left for this key
      if (next === 0) {
        const shownAt = shownAtRef.current.get(key) ?? null

        // If not shown yet, cancel scheduled show and flush
        if (!shownAt) {
          clearTimerMap(delayTimersRef.current, key)
          scheduleFlush()
          if (cur === 0 && warnOnMismatch) {
            // warn only when stop called extra times
             
            console.warn(`[useLoading] stop() called more times than start() for key="${key}"`)
          }
          return next
        }

        // ensure minimum duration for this shown key
        const elapsed = Date.now() - (shownAt ?? 0)
        const remaining = Math.max(0, minDurationMs - elapsed)

        // clear existing min timer then schedule hide of this key
        clearTimerMap(minTimersRef.current, key)
        const t = setTimeout(() => {
          shownAtRef.current.set(key, null)
          clearTimerMap(minTimersRef.current, key)
          scheduleFlush()
        }, remaining)
        minTimersRef.current.set(key, t)
      } else {
        // still active callers -> no hide action, but flush to keep state consistent
        scheduleFlush()
      }

      return next
    },
    [clearTimerMap, minDurationMs, scheduleFlush, warnOnMismatch]
  )

  /* Wrap an async function ensuring start/stop; optional key */
  const wrap = useCallback(
    async <T,>(fn: () => Promise<T>, key = DEFAULT_KEY): Promise<T> => {
      start(key)
      try {
        const res = await fn()
        return res
      } finally {
        stop(key)
      }
    },
    [start, stop]
  )

  /* utility: total active count across keys */
  const count = useCallback(() => {
    let total = 0
    for (const v of countersRef.current.values()) total += v
    return total
  }, [])

  /* utility: is loading for key (or any when omitted) */
  const isLoadingFor = useCallback((key?: string) => {
    if (!key) return count() > 0
    return (countersRef.current.get(key) ?? 0) > 0
  }, [count])

  return {
    loading: visible,
    start,
    stop,
    wrap,
    count,
    isLoadingFor
  }
}
