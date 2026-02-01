import { useState } from 'react'

import { Cookies } from '../../cookies'

enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

/**
 * Handles light/dark theme switching using data-theme attribute.
 * Cookie is used only for persistence, not as source of truth.
 * @returns {Object} - An object containing theme management functions and current theme.
 */
export const useTheme = () => {

  // STATES
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT)
  /**
   * Applies theme to DOM and persists it.
   * @param theme
   */
  const applyTheme = (theme: Theme): void => {
    document.documentElement.setAttribute('data-theme', theme)
    Cookies.set('theme', theme, { expires: 365 })
    setTheme(theme)
  }

  /**
   * Toggles between light and dark themes.
   */
  const toggleTheme = (): void => {
    if (typeof document === 'undefined') return

    const current =
      (document.documentElement.getAttribute('data-theme') as Theme) ??
      Theme.LIGHT

    applyTheme(current === Theme.DARK ? Theme.LIGHT : Theme.DARK)
    setTheme(current === Theme.DARK ? Theme.LIGHT : Theme.DARK)
  }

  /**
   * Initializes theme from cookie or system preference.
   */
  const initTheme = (): void => {
    if (typeof document === 'undefined') return

    const cookieTheme = Cookies.get('theme') as Theme | undefined

    const systemTheme =
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? Theme.DARK
        : Theme.LIGHT

    applyTheme(cookieTheme ?? systemTheme)
    setTheme(cookieTheme ?? systemTheme)
  }

  return {
    setTheme: applyTheme,
    toggleTheme,
    initTheme,
    theme
  }
}
