'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Rocket, Users, Globe, FlaskConical, BookHeart, Radio, Code2, ArrowRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function Roadmap() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { t } = useI18n()

  const phases = [
    {
      periodKey: 'roadmap.phase1.period',
      labelKey: 'roadmap.phase1.label',
      color: 'bg-orange-soft',
      textColor: 'text-orange-text',
      borderColor: 'border-orange-soft',
      icon: FlaskConical,
      titleKey: 'roadmap.phase1.title',
      itemKeys: [
        'roadmap.phase1.item1',
        'roadmap.phase1.item2',
        'roadmap.phase1.item3',
        'roadmap.phase1.item4',
      ],
    },
    {
      periodKey: 'roadmap.phase2.period',
      labelKey: 'roadmap.phase2.label',
      color: 'bg-brown',
      textColor: 'text-brown',
      borderColor: 'border-brown',
      icon: Users,
      titleKey: 'roadmap.phase2.title',
      itemKeys: [
        'roadmap.phase2.item1',
        'roadmap.phase2.item2',
        'roadmap.phase2.item3',
        'roadmap.phase2.item4',
        'roadmap.phase2.item5',
      ],
    },
    {
      periodKey: 'roadmap.phase3.period',
      labelKey: 'roadmap.phase3.label',
      color: 'bg-green-forest',
      textColor: 'text-green-forest',
      borderColor: 'border-green-forest',
      icon: Globe,
      titleKey: 'roadmap.phase3.title',
      itemKeys: [
        'roadmap.phase3.item1',
        'roadmap.phase3.item2',
        'roadmap.phase3.item3',
        'roadmap.phase3.item4',
        'roadmap.phase3.item5',
        'roadmap.phase3.item6',
      ],
    },
  ]

  const futureProducts = [
    {
      icon: BookHeart,
      nameKey: 'roadmap.future1.name',
      descKey: 'roadmap.future1.desc',
      color: 'bg-orange-soft/15 text-orange-text',
    },
    {
      icon: Radio,
      nameKey: 'roadmap.future2.name',
      descKey: 'roadmap.future2.desc',
      color: 'bg-green-forest/15 text-green-forest',
    },
    {
      icon: Code2,
      nameKey: 'roadmap.future3.name',
      descKey: 'roadmap.future3.desc',
      color: 'bg-brown/10 text-brown',
    },
  ]

  return (
    <section id="roadmap" ref={ref} className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cream via-white to-cream" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-orange-text font-bold text-sm uppercase tracking-widest mb-3">
            {t('roadmap.tag')}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-dark">
            {t('roadmap.title')}
          </h2>
          <p className="text-text-muted mt-4 max-w-2xl mx-auto text-lg">
            {t('roadmap.subtitle')}
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line (desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-[3px] bg-brown/15 rounded-full -translate-x-1/2" />

          <div className="space-y-12 lg:space-y-16">
            {phases.map((phase, i) => (
              <motion.div
                key={phase.periodKey}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.2 }}
                className={`relative lg:grid lg:grid-cols-2 lg:gap-12 items-start ${
                  i % 2 === 0 ? '' : 'lg:direction-rtl'
                }`}
              >
                {/* Timeline dot (desktop) */}
                <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-0 z-10">
                  <div className={`w-12 h-12 rounded-full ${phase.color} flex items-center justify-center shadow-lg`}>
                    <phase.icon size={20} className="text-white" />
                  </div>
                </div>

                {/* Content card */}
                <div className={`${i % 2 === 0 ? 'lg:pr-16 lg:text-right' : 'lg:col-start-2 lg:pl-16'}`}>
                  <div className={`bg-white rounded-2xl p-6 sm:p-8 shadow-sm border-l-4 ${phase.borderColor}`}>
                    {/* Mobile icon */}
                    <div className={`lg:hidden w-10 h-10 rounded-full ${phase.color} flex items-center justify-center mb-4`}>
                      <phase.icon size={18} className="text-white" />
                    </div>

                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${phase.color}/15 ${phase.textColor} mb-3`}>
                      {t(phase.labelKey)}
                    </div>
                    <p className="text-text-muted text-sm font-semibold mb-1">{t(phase.periodKey)}</p>
                    <h3 className="font-heading text-xl font-bold text-text-dark mb-4">{t(phase.titleKey)}</h3>

                    <ul className={`space-y-2 ${i % 2 === 0 ? 'lg:text-left' : ''}`}>
                      {phase.itemKeys.map((key, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-text-muted">
                          <ArrowRight size={14} className={`${phase.textColor} mt-0.5 flex-shrink-0`} />
                          <span>{t(key)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Empty space for alternating layout */}
                {i % 2 === 0 ? <div className="hidden lg:block" /> : null}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Future products */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mt-20"
        >
          <h3 className="font-heading text-2xl font-bold text-text-dark text-center mb-10">
            {t('roadmap.future.title')}
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {futureProducts.map((product) => (
              <div
                key={product.nameKey}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${product.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <product.icon size={22} />
                </div>
                <h4 className="font-heading text-lg font-bold text-text-dark mb-2">{t(product.nameKey)}</h4>
                <p className="text-sm text-text-muted leading-relaxed">{t(product.descKey)}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-16 text-center"
        >
          <div className="inline-block bg-gradient-to-r from-brown/10 via-orange-soft/15 to-brown/10 rounded-2xl px-8 py-5">
            <p className="font-heading text-lg font-bold text-brown">
              {t('roadmap.bottom.line1').split('{accent}')[0]}
              <span className="text-orange-text">{t('roadmap.bottom.accent')}</span>
              {t('roadmap.bottom.line1').split('{accent}')[1]}
            </p>
            <p className="text-text-muted text-sm mt-2">
              {t('roadmap.bottom.line2')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
