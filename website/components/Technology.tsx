'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Cpu, AudioWaveform, Volume2, Code2, ShieldCheck, Server, Smartphone, LayoutDashboard } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const aiStackKeys = [
  { icon: Cpu, nameKey: 'tech.ai1.name', descKey: 'tech.ai1.desc', whyKey: 'tech.ai1.why' },
  { icon: AudioWaveform, nameKey: 'tech.ai2.name', descKey: 'tech.ai2.desc', whyKey: 'tech.ai2.why' },
  { icon: Volume2, nameKey: 'tech.ai3.name', descKey: 'tech.ai3.desc', whyKey: 'tech.ai3.why' },
  { icon: Code2, nameKey: 'tech.ai4.name', descKey: 'tech.ai4.desc', whyKey: 'tech.ai4.why' },
]

const infraStackKeys = [
  { icon: Server, nameKey: 'tech.infra1.name', whyKey: 'tech.infra1.why' },
  { icon: Smartphone, nameKey: 'tech.infra2.name', whyKey: 'tech.infra2.why' },
  { icon: LayoutDashboard, nameKey: 'tech.infra3.name', whyKey: 'tech.infra3.why' },
]

const securityKeys = ['tech.security1', 'tech.security2', 'tech.security3', 'tech.security4']

export default function Technology() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { t } = useI18n()

  return (
    <section
      id="technologie"
      ref={ref}
      className="py-16 sm:py-24 md:py-32 relative"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white via-cream to-cream" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-orange-text font-bold text-sm uppercase tracking-widest mb-3">
            {t('tech.tag')}
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-dark">
            {t('tech.title')}
          </h2>
          <p className="text-text-muted mt-4 max-w-2xl mx-auto">
            {t('tech.subtitle')}
          </p>
        </motion.div>

        {/* AI Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="font-heading text-lg font-bold text-brown mb-4">{t('tech.ai.title')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiStackKeys.map((tech, i) => (
              <motion.div
                key={tech.nameKey}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-brown/10 flex items-center justify-center mb-3">
                  <tech.icon size={20} className="text-brown" />
                </div>
                <h4 className="font-heading text-sm font-bold text-text-dark mb-1">
                  {t(tech.nameKey)}
                </h4>
                <p className="text-text-muted text-xs leading-relaxed mb-3">
                  {t(tech.descKey)}
                </p>
                <div className="bg-cream rounded-lg px-3 py-2">
                  <p className="text-orange-text text-xs font-semibold leading-relaxed">
                    {t('tech.why')} {t(tech.whyKey)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Infra Stack — Why these choices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8"
        >
          <h3 className="font-heading text-lg font-bold text-brown mb-4">{t('tech.infra.title')}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {infraStackKeys.map((tech, i) => (
              <motion.div
                key={tech.nameKey}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-soft/15 flex items-center justify-center">
                    <tech.icon size={20} className="text-orange-text" />
                  </div>
                  <h4 className="font-heading text-sm font-bold text-text-dark">
                    {t(tech.nameKey)}
                  </h4>
                </div>
                <p className="text-text-muted text-xs leading-relaxed">
                  {t(tech.whyKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Security section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-5">
            <ShieldCheck size={24} className="text-green-forest" />
            <h3 className="font-heading text-lg font-bold text-text-dark">
              {t('tech.security.title')}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {securityKeys.map((key) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-forest/15 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-green-forest"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-text-dark">
                  {t(key)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
