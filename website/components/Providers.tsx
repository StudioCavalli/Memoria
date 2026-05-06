'use client'

import { MotionConfig } from 'framer-motion'
import { I18nProvider } from '@/lib/i18n'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <I18nProvider>{children}</I18nProvider>
    </MotionConfig>
  )
}
