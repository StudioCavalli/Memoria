'use client'

import { useI18n } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

const locales: { code: Locale; flag: string; label: string }[] = [
  { code: 'fr', flag: '\u{1F1EB}\u{1F1F7}', label: 'Français' },
  { code: 'en', flag: '\u{1F1EC}\u{1F1E7}', label: 'English' },
  { code: 'es', flag: '\u{1F1EA}\u{1F1F8}', label: 'Español' },
  { code: 'it', flag: '\u{1F1EE}\u{1F1F9}', label: 'Italiano' },
]

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="flex items-center gap-1">
      {locales.map((l) => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          aria-label={l.label}
          title={l.label}
          className={`text-base sm:text-lg leading-none px-1.5 py-1 rounded-md transition-all cursor-pointer border-none bg-transparent ${
            locale === l.code
              ? 'ring-2 ring-brown ring-offset-1 scale-110'
              : 'opacity-60 hover:opacity-100 hover:scale-105'
          }`}
        >
          {l.flag}
        </button>
      ))}
    </div>
  )
}
