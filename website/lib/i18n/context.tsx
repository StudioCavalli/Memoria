'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { translations, Locale } from './translations'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  locale: 'fr',
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always start with 'fr' to match SSR — avoids hydration mismatch
  const [locale, setLocaleState] = useState<Locale>('fr')

  // Load saved locale AFTER hydration
  useEffect(() => {
    const saved = localStorage.getItem('memoria_locale') as Locale | null
    if (saved && saved !== 'fr' && translations[saved]) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('memoria_locale', newLocale)
  }, [])

  const t = useCallback(
    (key: string) => translations[locale][key] || translations['fr'][key] || key,
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
