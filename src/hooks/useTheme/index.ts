'use client'

import { useCallback, useEffect, useState } from 'react'

import { Cookies } from '../../cookies'

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

export type ThemePreference = Theme | 'system'

interface UseThemeOptions {
  /** Cookie used to persist the user's preference. */
  cookieName?: string
  /** Cookie lifetime in days. */
  cookieExpires?: number
  /** Automatically initialize the theme after the component mounts. */
  autoInit?: boolean
}

interface ThemeChangeDetail {
  theme: Theme
  preference: ThemePreference
}

const THEME_CHANGE_EVENT = 'app:theme-change'
const DEFAULT_COOKIE_NAME = 'theme'
const DEFAULT_COOKIE_EXPIRES = 365

const isThemePreference = (value: unknown): value is ThemePreference => {
  return value === Theme.LIGHT || value === Theme.DARK || value === 'system'
}

const isTheme = (value: unknown): value is Theme => {
  return value === Theme.LIGHT || value === Theme.DARK
}

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return Theme.LIGHT
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? Theme.DARK
    : Theme.LIGHT
}

const resolveTheme = (preference: ThemePreference): Theme => {
  return preference === 'system' ? getSystemTheme() : preference
}

/**
 * Manages the application theme.
 *
 * - Persists the preference (`light`, `dark` or `system`) in a cookie.
 * - Applies the resolved theme to `document.documentElement[data-theme]`.
 * - Reacts to operating-system theme changes when preference is `system`.
 * - Synchronizes instances of this hook in the same browser tab.
 * - Initializes after mount to avoid accessing browser APIs during SSR.
 * @param options
 */
export const useTheme = (options: UseThemeOptions = {}) => {
  const {
    cookieName = DEFAULT_COOKIE_NAME,
    cookieExpires = DEFAULT_COOKIE_EXPIRES,
    autoInit = true
  } = options

  const [theme, setThemeState] = useState<Theme>(Theme.LIGHT)
  const [preference, setPreferenceState] = useState<ThemePreference>('system')
  const [isInitialized, setIsInitialized] = useState(false)

  const applyThemePreference = useCallback((
    nextPreference: ThemePreference,
    config: { persist?: boolean } = {}
  ): void => {
    const nextTheme = resolveTheme(nextPreference)

    // React state remains usable even when the hook is rendered in an SSR context.
    setPreferenceState(nextPreference)
    setThemeState(nextTheme)

    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', nextTheme)
      document.documentElement.style.colorScheme = nextTheme
    }

    if (config.persist !== false) {
      try {
        Cookies.set(cookieName, nextPreference, { expires: cookieExpires })
      } catch {
        // Theme switching should still work if cookie persistence is unavailable.
      }
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      const detail: ThemeChangeDetail = {
        theme: nextTheme,
        preference: nextPreference
      }

      window.dispatchEvent(
        new CustomEvent<ThemeChangeDetail>(THEME_CHANGE_EVENT, { detail })
      )
    }
  }, [cookieExpires, cookieName])

  /** Set an explicit theme or follow the operating-system preference. */
  const setTheme = useCallback((nextPreference: ThemePreference): void => {
    if (!isThemePreference(nextPreference)) return
    applyThemePreference(nextPreference)
    setIsInitialized(true)
  }, [applyThemePreference])

  /** Toggle from the currently resolved theme to the opposite explicit theme. */
  const toggleTheme = useCallback((): void => {
    const nextTheme = theme === Theme.DARK ? Theme.LIGHT : Theme.DARK
    setTheme(nextTheme)
  }, [setTheme, theme])

  /** Read the saved preference and apply it, or fall back to system preference. */
  const initTheme = useCallback((): void => {
    let savedPreference: unknown

    try {
      savedPreference = Cookies.get(cookieName)
    } catch {
      savedPreference = undefined
    }

    const initialPreference = isThemePreference(savedPreference)
      ? savedPreference
      : 'system'

    applyThemePreference(initialPreference, { persist: false })
    setIsInitialized(true)
  }, [applyThemePreference, cookieName])

  // Automatically initialize once on mount; callers can opt out and call initTheme themselves.
  useEffect(() => {
    if (autoInit) initTheme()
  }, [autoInit, initTheme])

  // Keep hook instances in the same tab in sync if one of them changes the theme.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleThemeChange = (event: Event): void => {
      const detail = (event as CustomEvent<ThemeChangeDetail>).detail
      if (!detail || !isTheme(detail.theme) || !isThemePreference(detail.preference)) return

      setThemeState(detail.theme)
      setPreferenceState(detail.preference)
    }

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange)
  }, [])

  // Follow changes to the operating system only while the preference is `system`.
  useEffect(() => {
    if (!isInitialized || preference !== 'system' || typeof window === 'undefined') return
    if (typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemThemeChange = (event: MediaQueryListEvent): void => {
      const nextTheme = event.matches ? Theme.DARK : Theme.LIGHT
      setThemeState(nextTheme)

      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', nextTheme)
        document.documentElement.style.colorScheme = nextTheme
      }

      const detail: ThemeChangeDetail = {
        theme: nextTheme,
        preference: 'system'
      }

      window.dispatchEvent(
        new CustomEvent<ThemeChangeDetail>(THEME_CHANGE_EVENT, { detail })
      )
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }

    // Compatibility with older browsers.
    mediaQuery.addListener(handleSystemThemeChange)
    return () => mediaQuery.removeListener(handleSystemThemeChange)
  }, [isInitialized, preference])

  return {
    /** Currently applied/resolved theme (`light` or `dark`). */
    theme,
    /** User preference (`light`, `dark` or `system`). */
    preference,
    /** True once the initial preference has been read and applied. */
    isInitialized,
    /** Convenience flag for components that need a boolean. */
    isDark: theme === Theme.DARK,
    /** Applies a light/dark/system preference and persists it. */
    setTheme,
    /** Toggles between light and dark, overriding system preference. */
    toggleTheme,
    /** Manually initializes the theme. Useful when `autoInit` is false. */
    initTheme,
    /** Explicitly returns control of the theme to the operating system. */
    useSystemTheme: () => setTheme('system')
  }
}
