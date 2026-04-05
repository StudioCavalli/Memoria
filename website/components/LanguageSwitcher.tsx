'use client'

import { useState, useRef, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

const locales: { code: Locale; label: string }[] = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
]

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const current = locales.find((l) => l.code === locale) || locales[0]

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSelect = (code: Locale) => {
    setLocale(code)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-brown hover:bg-brown/5 transition-colors cursor-pointer border-none bg-transparent"
      >
        {current.label}
        <svg
          className={`w-3.5 h-3.5 text-brown/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        role="listbox"
        aria-label="Language"
        className={`absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl shadow-lg border border-brown/10 py-1.5 z-50 transition-all duration-200 origin-top ${
          open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {locales.map((l) => {
          const isActive = locale === l.code
          return (
            <button
              key={l.code}
              role="option"
              aria-selected={isActive}
              onClick={() => handleSelect(l.code)}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-none bg-transparent text-left ${
                isActive
                  ? 'text-brown bg-brown/5 font-semibold'
                  : 'text-text-dark hover:bg-brown/5'
              }`}
            >
              <span className="flex-1">{l.label}</span>
              {isActive && (
                <svg
                  className="w-4 h-4 text-brown"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
